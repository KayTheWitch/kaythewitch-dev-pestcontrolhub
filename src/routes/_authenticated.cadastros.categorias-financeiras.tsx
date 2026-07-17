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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { FINANCIAL_CATEGORY_TYPE_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cadastros/categorias-financeiras")({
  component: CategoriasFinanceirasPage,
});

function CategoriasFinanceirasPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["financial_categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_categories")
        .select("*")
        .order("tipo")
        .order("nome");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (v: any) => {
      const slug = `${v.tipo}_${v.nome.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "_")}`;
      const { error } = await supabase
        .from("financial_categories")
        .insert({ tipo: v.tipo, nome: v.nome, slug });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria criada");
      qc.invalidateQueries({ queryKey: ["financial_categories"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("financial_categories")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial_categories"] }),
  });

  return (
    <>
      <PageHeader
        title="Categorias financeiras"
        description="Plano de contas para classificar receitas e despesas."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova categoria
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
              <TableHead>Tipo</TableHead>
              <TableHead className="w-24">Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nome}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      r.tipo === "receita"
                        ? "bg-success/15 text-success border-success/30"
                        : "bg-destructive/15 text-destructive border-destructive/30"
                    }
                  >
                    {FINANCIAL_CATEGORY_TYPE_LABEL[r.tipo]}
                  </Badge>
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
  const [f, setF] = useState({ nome: "", tipo: "despesa" });
  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova categoria</DialogTitle>
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
          <Input
            required
            value={f.nome}
            onChange={(e) => setF({ ...f, nome: e.target.value })}
          />
        </div>
        <div>
          <Label>Tipo *</Label>
          <Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
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
