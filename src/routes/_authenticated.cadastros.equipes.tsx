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

export const Route = createFileRoute("/_authenticated/cadastros/equipes")({
  component: EquipesPage,
});

function EquipesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").order("nome");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (v: any) => {
      const { id, ...rest } = v;
      if (id) {
        const { error } = await supabase.from("teams").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("teams").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Equipe salva");
      qc.invalidateQueries({ queryKey: ["teams"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.rpc as any)("delete_team", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipe excluída");
      qc.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("teams").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });

  return (
    <>
      <PageHeader
        title="Equipes"
        description="Equipes técnicas designadas para execução das ordens de serviço."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova equipe
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
          <TeamForm
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
              <TableHead>Descrição</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead className="w-24">Ativa</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nome}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.descricao}</TableCell>
                <TableCell className="text-sm">
                  {((r.membros as any[]) ?? []).length} pessoas
                </TableCell>
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
                    label={`Excluir equipe "${r.nome}"?`}
                    description="Equipes com ordens de serviço vinculadas não podem ser excluídas — nesse caso, inative a equipe."
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Cadastre a primeira equipe.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function TeamForm({
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
    nome: initial?.nome ?? "",
    descricao: initial?.descricao ?? "",
    membros_raw: ((initial?.membros as any[]) ?? [])
      .map((m: any) => m?.nome ?? "")
      .filter(Boolean)
      .join("\n"),
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle>{initial ? "Editar equipe" : "Nova equipe"}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const membros = form.membros_raw
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((nome) => ({ nome }));
          onSubmit({
            id: form.id,
            nome: form.nome,
            descricao: form.descricao,
            membros,
          });
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
          <Label>Descrição</Label>
          <Input
            value={form.descricao ?? ""}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </div>
        <div>
          <Label>Membros (um nome por linha)</Label>
          <Textarea
            rows={4}
            value={form.membros_raw}
            onChange={(e) => setForm({ ...form, membros_raw: e.target.value })}
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
