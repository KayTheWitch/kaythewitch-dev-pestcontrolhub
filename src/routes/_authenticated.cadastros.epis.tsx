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

export const Route = createFileRoute("/_authenticated/cadastros/epis")({
  component: EpisPage,
});

function EpisPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["epis"],
    queryFn: async () => {
      const { data } = await supabase.from("epis").select("*").order("nome");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (v: any) => {
      const { id, ...rest } = v;
      if (id) {
        const { error } = await supabase.from("epis").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("epis").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("EPI salvo");
      qc.invalidateQueries({ queryKey: ["epis"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.rpc as any)("delete_epi", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("EPI excluído");
      qc.invalidateQueries({ queryKey: ["epis"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("epis").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["epis"] }),
  });

  return (
    <>
      <PageHeader
        title="EPIs"
        description="Equipamentos de proteção individual obrigatórios por serviço."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo EPI
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
              <TableHead>CA</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-24">Ativo</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nome}</TableCell>
                <TableCell className="text-sm">{r.ca}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.descricao}</TableCell>
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
                    description="EPIs com entregas registradas não podem ser excluídos — nesse caso, inative o EPI."
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhum EPI cadastrado.
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
    ca: initial?.ca ?? "",
    descricao: initial?.descricao ?? "",
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle>{initial ? "Editar EPI" : "Novo EPI"}</DialogTitle>
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
          <Label>CA</Label>
          <Input value={f.ca ?? ""} onChange={(e) => setF({ ...f, ca: e.target.value })} />
        </div>
        <div>
          <Label>Descrição</Label>
          <Input
            value={f.descricao ?? ""}
            onChange={(e) => setF({ ...f, descricao: e.target.value })}
          />
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
