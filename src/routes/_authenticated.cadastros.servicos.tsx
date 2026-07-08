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
import { formatCurrency, SERVICE_TYPE_LABEL } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cadastros/servicos")({
  component: ServicosPage,
});

function ServicosPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: rows = [] } = useQuery({
    queryKey: ["service-catalog"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_catalog")
        .select("*")
        .order("nome");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("service_catalog").insert(v);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Serviço criado");
      qc.invalidateQueries({ queryKey: ["service-catalog"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("service_catalog")
        .update({ ativo })
        .eq("id", id);
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo serviço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ServiceForm onSubmit={(v) => create.mutate(v)} submitting={create.isPending} />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Preço base</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="w-24">Ativo</TableHead>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function ServiceForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    tipo: "controle_pragas",
    nome: "",
    descricao: "",
    preco_base: "",
    unidade: "servico",
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle>Novo serviço</DialogTitle>
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
          <Select
            value={form.tipo}
            onValueChange={(v) => setForm({ ...form, tipo: v })}
          >
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
            value={form.descricao}
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
