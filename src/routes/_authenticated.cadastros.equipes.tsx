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
  DialogTrigger,
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

export const Route = createFileRoute("/_authenticated/cadastros/equipes")({
  component: EquipesPage,
});

function EquipesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: rows = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").order("nome");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("teams").insert(v);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipe criada");
      qc.invalidateQueries({ queryKey: ["teams"] });
      setOpen(false);
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova equipe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <TeamForm onSubmit={(v) => create.mutate(v)} submitting={create.isPending} />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead className="w-24">Ativa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nome}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.descricao}
                </TableCell>
                <TableCell className="text-sm">
                  {((r.membros as any[]) ?? []).length} pessoas
                </TableCell>
                <TableCell>
                  <Switch
                    checked={r.ativo}
                    onCheckedChange={(v) => toggle.mutate({ id: r.id, ativo: v })}
                  />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
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
  onSubmit,
  submitting,
}: {
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({ nome: "", descricao: "", membros_raw: "" });
  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova equipe</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const membros = form.membros_raw
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((nome) => ({ nome }));
          onSubmit({ nome: form.nome, descricao: form.descricao, membros });
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
            value={form.descricao}
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
