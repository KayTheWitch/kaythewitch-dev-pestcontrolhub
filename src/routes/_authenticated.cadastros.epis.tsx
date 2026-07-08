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

export const Route = createFileRoute("/_authenticated/cadastros/epis")({
  component: EpisPage,
});

function EpisPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: rows = [] } = useQuery({
    queryKey: ["epis"],
    queryFn: async () => {
      const { data } = await supabase.from("epis").select("*").order("nome");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("epis").insert(v);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("EPI criado");
      qc.invalidateQueries({ queryKey: ["epis"] });
      setOpen(false);
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo EPI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <Form onSubmit={(v) => create.mutate(v)} submitting={create.isPending} />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CA</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-24">Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nome}</TableCell>
                <TableCell className="text-sm">{r.ca}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.descricao}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={r.ativo}
                    onCheckedChange={(v) => toggle.mutate({ id: r.id, ativo: v })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function Form({
  onSubmit,
  submitting,
}: {
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [f, setF] = useState({ nome: "", ca: "", descricao: "" });
  return (
    <>
      <DialogHeader>
        <DialogTitle>Novo EPI</DialogTitle>
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
          <Input value={f.ca} onChange={(e) => setF({ ...f, ca: e.target.value })} />
        </div>
        <div>
          <Label>Descrição</Label>
          <Input
            value={f.descricao}
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
