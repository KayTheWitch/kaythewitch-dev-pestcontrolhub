import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatCurrency, SERVICE_TYPE_LABEL } from "@/lib/format";
import { toast } from "sonner";
import { RowActions } from "@/components/RowActions";

export const Route = createFileRoute("/_authenticated/cadastros/servicos")({
  component: ServicosPage,
});

function ServicosPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["service-catalog"],
    queryFn: async () => {
      const { data } = await supabase.from("service_catalog").select("*").order("nome");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (v: any) => {
      const { id, ...rest } = v;
      if (id) {
        const { error } = await supabase.from("service_catalog").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("service_catalog").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Serviço salvo");
      qc.invalidateQueries({ queryKey: ["service-catalog"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.rpc as any)("delete_service_catalog_item", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Serviço excluído");
      qc.invalidateQueries({ queryKey: ["service-catalog"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("service_catalog").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-catalog"] }),
  });

  return (
    <>
      <PageHeader
        title="Serviços"
        description="Catálogo de serviços com preço base usado nas propostas."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo serviço
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
          <ServiceForm
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
              <TableHead>Tipo</TableHead>
              <TableHead>Preço base</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="w-24">Ativo</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.nome}</div>
                  <div className="text-xs text-muted-foreground">{r.descricao}</div>
                </TableCell>
                <TableCell>{SERVICE_TYPE_LABEL[r.tipo]}</TableCell>
                <TableCell>{formatCurrency(r.preco_base)}</TableCell>
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
                    description="O serviço deixará de aparecer no catálogo de propostas. Propostas já emitidas não são afetadas."
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum serviço cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function ServiceForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: any;
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    id: initial?.id as string | undefined,
    tipo: initial?.tipo ?? "controle_pragas",
    nome: initial?.nome ?? "",
    descricao: initial?.descricao ?? "",
    preco_base: initial?.preco_base != null ? String(initial.preco_base) : "",
    unidade: initial?.unidade ?? "servico",
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle>{initial ? "Editar serviço" : "Novo serviço"}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ ...form, preco_base: Number(form.preco_base) || 0 });
        }}
        className="space-y-3"
      >
        <div>
          <Label>Nome *</Label>
          <Input
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SERVICE_TYPE_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea
            value={form.descricao ?? ""}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Preço base (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.preco_base}
              onChange={(e) => setForm({ ...form, preco_base: e.target.value })}
            />
          </div>
          <div>
            <Label>Unidade</Label>
            <Input
              value={form.unidade}
              onChange={(e) => setForm({ ...form, unidade: e.target.value })}
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
