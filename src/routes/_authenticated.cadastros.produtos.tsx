import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { RowActions } from "@/components/RowActions";

export const Route = createFileRoute("/_authenticated/cadastros/produtos")({
  component: ProdutosPage,
});

function ProdutosPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("nome");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (v: any) => {
      const { id, ...rest } = v;
      if (id) {
        const { error } = await supabase.from("products").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Produto salvo");
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.rpc as any)("delete_product", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("products").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  return (
    <>
      <PageHeader
        title="Produtos"
        description="Produtos químicos e sanitizantes utilizados nos serviços."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo produto
          </Button>
        }
      />

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogContent>
          <Form
            key={editing?.id ?? "novo"}
            initial={editing}
            onSubmit={(v) => save.mutate(v)}
            submitting={save.isPending}
          />
        </DialogContent>
      </Dialog>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Princípio ativo</TableHead>
              <TableHead>Registro MS</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="w-24">Ativo</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nome}</TableCell>
                <TableCell className="text-sm">{r.principio_ativo}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.registro_ms}
                </TableCell>
                <TableCell>{r.unidade}</TableCell>
                <TableCell>
                  <Switch
                    checked={r.ativo}
                    onCheckedChange={(v) => toggle.mutate({ id: r.id, ativo: v })}
                  />
                </TableCell>
                <TableCell>
                  <RowActions
                    onEdit={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                    onDelete={() => remove.mutate(r.id)}
                    deleting={remove.isPending}
                    label={`Excluir "${r.nome}"?`}
                    description="Produtos com lotes, movimentação de estoque ou uso em OS não podem ser excluídos — nesses casos, inative o produto."
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum produto cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function Form({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: any;
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [f, setF] = useState({
    id: initial?.id as string | undefined,
    nome: initial?.nome ?? "",
    principio_ativo: initial?.principio_ativo ?? "",
    registro_ms: initial?.registro_ms ?? "",
    unidade: initial?.unidade ?? "L",
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle>{initial ? "Editar produto" : "Novo produto"}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(f);
        }}
        className="space-y-3"
      >
        <div>
          <Label>Nome *</Label>
          <Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        </div>
        <div>
          <Label>Princípio ativo</Label>
          <Input
            value={f.principio_ativo ?? ""}
            onChange={(e) => setF({ ...f, principio_ativo: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Registro MS/ANVISA</Label>
            <Input
              value={f.registro_ms ?? ""}
              onChange={(e) => setF({ ...f, registro_ms: e.target.value })}
            />
          </div>
          <div>
            <Label>Unidade</Label>
            <Input
              value={f.unidade}
              onChange={(e) => setF({ ...f, unidade: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
