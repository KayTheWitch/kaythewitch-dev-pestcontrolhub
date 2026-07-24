import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Pencil, Upload, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/compliance/produtos-regulatorio")({
  component: ProdRegPage,
});

type Product = {
  id: string;
  nome: string;
  registro_ms: string | null;
  classe_toxicologica: string | null;
  grupo_quimico: string | null;
  principio_ativo: string | null;
  antidoto: string | null;
  telefone_cit: string | null;
  ativo: boolean;
};

type RegDoc = {
  id: string;
  product_id: string;
  tipo: string;
  numero: string | null;
  validade: string | null;
  arquivo_path: string | null;
};

function ProdRegPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products", "regulatorio"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id, nome, registro_ms, classe_toxicologica, grupo_quimico, principio_ativo, antidoto, telefone_cit, ativo",
        )
        .eq("ativo", true)
        .order("nome");
      return (data ?? []) as Product[];
    },
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["regulatory_documents"],
    queryFn: async () => {
      const { data } = await supabase.from("regulatory_documents").select("*");
      return (data ?? []) as RegDoc[];
    },
  });

  const save = useMutation({
    mutationFn: async (v: Partial<Product> & { id: string }) => {
      const { id, ...rest } = v;
      const { error } = await supabase.from("products").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto atualizado");
      qc.invalidateQueries({ queryKey: ["products", "regulatorio"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadDoc = useMutation({
    mutationFn: async ({
      product_id,
      tipo,
      file,
    }: {
      product_id: string;
      tipo: string;
      file: File;
    }) => {
      const path = `produtos/${product_id}/${tipo}-${crypto.randomUUID()}-${file.name}`;
      const up = await supabase.storage.from("compliance-docs").upload(path, file);
      if (up.error) throw up.error;
      const { error } = await supabase
        .from("regulatory_documents")
        .insert({ product_id, tipo, arquivo_path: path });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento anexado");
      qc.invalidateQueries({ queryKey: ["regulatory_documents"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function download(path: string) {
    const { data, error } = await supabase.storage
      .from("compliance-docs")
      .createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  return (
    <>
      <PageHeader
        title="Produtos — Cadastro Regulatório"
        description="Registro MS, classe toxicológica, princípio ativo, antídoto e documentos (FISPQ, bula)."
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Registro MS</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Princípio ativo</TableHead>
              <TableHead>FISPQ / Bula</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const pDocs = docs.filter((d) => d.product_id === p.id);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell
                    className={`text-sm ${!p.registro_ms ? "text-destructive" : ""}`}
                  >
                    {p.registro_ms || "não cadastrado"}
                  </TableCell>
                  <TableCell className="text-sm">{p.classe_toxicologica || "—"}</TableCell>
                  <TableCell className="text-sm">{p.principio_ativo || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {pDocs.map((d) => (
                        <Button
                          key={d.id}
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => d.arquivo_path && download(d.arquivo_path)}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          {d.tipo}
                          <Download className="w-3 h-3 ml-1" />
                        </Button>
                      ))}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f)
                              uploadDoc.mutate({ product_id: p.id, tipo: "fispq", file: f });
                          }}
                        />
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-muted">
                          <Upload className="w-3 h-3" /> anexar
                        </span>
                      </label>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <EditForm
              product={editing}
              onSubmit={(v) => save.mutate({ id: editing.id, ...v })}
              submitting={save.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditForm({
  product,
  onSubmit,
  submitting,
}: {
  product: Product;
  onSubmit: (v: Partial<Product>) => void;
  submitting: boolean;
}) {
  const [f, setF] = useState({
    registro_ms: product.registro_ms || "",
    classe_toxicologica: product.classe_toxicologica || "",
    grupo_quimico: product.grupo_quimico || "",
    principio_ativo: product.principio_ativo || "",
    antidoto: product.antidoto || "",
    telefone_cit: product.telefone_cit || "",
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle>{product.nome} — dados regulatórios</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            registro_ms: f.registro_ms || null,
            classe_toxicologica: f.classe_toxicologica || null,
            grupo_quimico: f.grupo_quimico || null,
            principio_ativo: f.principio_ativo || null,
            antidoto: f.antidoto || null,
            telefone_cit: f.telefone_cit || null,
          });
        }}
        className="space-y-3"
      >
        <div>
          <Label>Registro MS/ANVISA *</Label>
          <Input
            required
            value={f.registro_ms}
            onChange={(e) => setF({ ...f, registro_ms: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Classe toxicológica</Label>
            <Input
              value={f.classe_toxicologica}
              onChange={(e) => setF({ ...f, classe_toxicologica: e.target.value })}
              placeholder="I, II, III, IV"
            />
          </div>
          <div>
            <Label>Grupo químico</Label>
            <Input
              value={f.grupo_quimico}
              onChange={(e) => setF({ ...f, grupo_quimico: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Princípio ativo</Label>
          <Input
            value={f.principio_ativo}
            onChange={(e) => setF({ ...f, principio_ativo: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Antídoto</Label>
            <Input
              value={f.antidoto}
              onChange={(e) => setF({ ...f, antidoto: e.target.value })}
            />
          </div>
          <div>
            <Label>Telefone do CIT</Label>
            <Input
              value={f.telefone_cit}
              onChange={(e) => setF({ ...f, telefone_cit: e.target.value })}
              placeholder="0800 722 6001"
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
