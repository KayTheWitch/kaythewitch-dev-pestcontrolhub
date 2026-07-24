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
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/compliance/embalagens")({
  component: EmbalagensPage,
});

function EmbalagensPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["packaging_returns"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packaging_returns")
        .select("*, products(nome), suppliers(razao_social)")
        .order("devolvido_em", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      return data ?? [];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("suppliers")
        .select("id, razao_social")
        .order("razao_social");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (v: any) => {
      let comprovante_path: string | null = null;
      if (v._file instanceof File) {
        const path = `embalagens/${crypto.randomUUID()}-${v._file.name}`;
        const up = await supabase.storage.from("compliance-docs").upload(path, v._file);
        if (up.error) throw up.error;
        comprovante_path = path;
      }
      const { _file, ...rest } = v;
      const { error } = await supabase
        .from("packaging_returns")
        .insert({ ...rest, comprovante_path });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Devolução registrada");
      qc.invalidateQueries({ queryKey: ["packaging_returns"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function download(path: string) {
    const { data, error } = await supabase.storage.from("compliance-docs").createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  return (
    <>
      <PageHeader
        title="Devolução de Embalagens"
        description="Registro de destinação de embalagens vazias por produto e fornecedor."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova devolução
              </Button>
            </DialogTrigger>
            <DialogContent>
              <Form
                products={products as any}
                suppliers={suppliers as any}
                onSubmit={(v) => create.mutate(v)}
                submitting={create.isPending}
              />
            </DialogContent>
          </Dialog>
        }
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Comprovante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm">
                  {new Date(r.devolvido_em).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-sm font-medium">{r.products?.nome}</TableCell>
                <TableCell className="text-sm">{r.suppliers?.razao_social ?? "—"}</TableCell>
                <TableCell className="text-sm">{r.quantidade}</TableCell>
                <TableCell>
                  {r.comprovante_path ? (
                    <Button size="sm" variant="ghost" onClick={() => download(r.comprovante_path)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma devolução registrada.
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
  products,
  suppliers,
  onSubmit,
  submitting,
}: {
  products: any[];
  suppliers: any[];
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [f, setF] = useState<any>({
    product_id: "",
    supplier_id: "",
    quantidade: 1,
    devolvido_em: new Date().toISOString().slice(0, 10),
    observacoes: "",
    _file: null,
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova devolução de embalagem</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            ...f,
            supplier_id: f.supplier_id || null,
            observacoes: f.observacoes || null,
          });
        }}
        className="space-y-3"
      >
        <div>
          <Label>Produto *</Label>
          <Select value={f.product_id} onValueChange={(v) => setF({ ...f, product_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Fornecedor (destino)</Label>
          <Select value={f.supplier_id} onValueChange={(v) => setF({ ...f, supplier_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Quantidade *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              required
              value={f.quantidade}
              onChange={(e) => setF({ ...f, quantidade: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Devolvido em *</Label>
            <Input
              type="date"
              required
              value={f.devolvido_em}
              onChange={(e) => setF({ ...f, devolvido_em: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Observações</Label>
          <Textarea
            rows={2}
            value={f.observacoes}
            onChange={(e) => setF({ ...f, observacoes: e.target.value })}
          />
        </div>
        <div>
          <Label>Comprovante (PDF/imagem)</Label>
          <Input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setF({ ...f, _file: e.target.files?.[0] ?? null })}
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting || !f.product_id}>
            {submitting ? "Salvando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
