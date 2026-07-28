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
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/fornecedores")({
  component: FornecedoresPage,
});

function FornecedoresPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [busca, setBusca] = useState("");

  const { data: rows = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("razao_social");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (v: any) => {
      if (v.id) {
        const { id, ...rest } = v;
        const { error } = await supabase.from("suppliers").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(v);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Fornecedor salvo");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("suppliers").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  const filtered = (rows as any[]).filter((r) =>
    [r.razao_social, r.nome_fantasia, r.cnpj, r.cidade]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(busca.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Fornecedores"
        description="Cadastro de fornecedores de produtos químicos, EPIs e serviços."
        actions={
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Novo fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
              </DialogHeader>
              <SupplierForm
                key={editing?.id ?? "novo"}
                initial={editing}
                submitting={save.isPending}
                onSubmit={(v) => save.mutate(v)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Buscar por razão social, CNPJ ou cidade"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razão social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead className="w-20">Ativo</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {r.razao_social}
                  {r.nome_fantasia && (
                    <div className="text-xs text-muted-foreground">{r.nome_fantasia}</div>
                  )}
                </TableCell>
                <TableCell className="text-sm">{r.cnpj ?? "—"}</TableCell>
                <TableCell className="text-sm">
                  {[r.contato_nome, r.telefone, r.email].filter(Boolean).join(" · ") || "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {[r.cidade, r.uf].filter(Boolean).join("/") || "—"}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={r.ativo}
                    onCheckedChange={(v) => toggle.mutate({ id: r.id, ativo: v })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function SupplierForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: any;
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [v, setV] = useState<any>({
    id: initial?.id,
    razao_social: initial?.razao_social ?? "",
    nome_fantasia: initial?.nome_fantasia ?? "",
    cnpj: initial?.cnpj ?? "",
    email: initial?.email ?? "",
    telefone: initial?.telefone ?? "",
    contato_nome: initial?.contato_nome ?? "",
    endereco: initial?.endereco ?? "",
    cidade: initial?.cidade ?? "",
    uf: initial?.uf ?? "",
    cep: initial?.cep ?? "",
    prazo_pagamento: initial?.prazo_pagamento ?? "",
    forma_pagamento: initial?.forma_pagamento ?? "",
    observacoes: initial?.observacoes ?? "",
  });
  const set = (k: string, val: any) => setV((s: any) => ({ ...s, [k]: val }));

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.razao_social) {
          toast.error("Razão social é obrigatória");
          return;
        }
        const payload: any = Object.fromEntries(
          Object.entries(v).map(([k, val]) => [k, val === "" ? null : val]),
        );
        if (!payload.id) delete payload.id;
        onSubmit(payload);
      }}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Razão social</Label>
          <Input value={v.razao_social} onChange={(e) => set("razao_social", e.target.value)} />
        </div>
        <div>
          <Label>Nome fantasia</Label>
          <Input value={v.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} />
        </div>
        <div>
          <Label>CNPJ</Label>
          <Input value={v.cnpj} onChange={(e) => set("cnpj", e.target.value)} />
        </div>
        <div>
          <Label>Contato</Label>
          <Input value={v.contato_nome} onChange={(e) => set("contato_nome", e.target.value)} />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input value={v.telefone} onChange={(e) => set("telefone", e.target.value)} />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input value={v.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Endereço</Label>
          <Input value={v.endereco} onChange={(e) => set("endereco", e.target.value)} />
        </div>
        <div>
          <Label>Cidade</Label>
          <Input value={v.cidade} onChange={(e) => set("cidade", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>UF</Label>
            <Input maxLength={2} value={v.uf} onChange={(e) => set("uf", e.target.value)} />
          </div>
          <div>
            <Label>CEP</Label>
            <Input value={v.cep} onChange={(e) => set("cep", e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Prazo de pagamento</Label>
          <Input value={v.prazo_pagamento} onChange={(e) => set("prazo_pagamento", e.target.value)} />
        </div>
        <div>
          <Label>Forma de pagamento</Label>
          <Input value={v.forma_pagamento} onChange={(e) => set("forma_pagamento", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Observações</Label>
        <Textarea value={v.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );
}
