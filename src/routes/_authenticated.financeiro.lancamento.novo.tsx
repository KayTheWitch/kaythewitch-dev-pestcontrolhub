import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
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
import { toast } from "sonner";

const searchSchema = z.object({
  tipo: z.enum(["receber", "pagar"]).optional(),
});

export const Route = createFileRoute("/_authenticated/financeiro/lancamento/novo")({
  validateSearch: (s) => searchSchema.parse(s),
  component: NovoLancamento,
});

function NovoLancamento() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<"receber" | "pagar">(search.tipo ?? "receber");
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    data_emissao: new Date().toISOString().slice(0, 10),
    data_vencimento: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    categoria_id: "",
    client_id: "",
    supplier_id: "",
    observacoes: "",
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ["fin-cat", tipo],
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_categories")
        .select("id, nome, tipo, ativo")
        .eq("ativo", true)
        .eq("tipo", tipo === "receber" ? "receita" : "despesa")
        .order("nome");
      return data ?? [];
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, razao_social").order("razao_social");
      return data ?? [];
    },
    enabled: tipo === "receber",
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers").select("id, razao_social").order("razao_social");
      return data ?? [];
    },
    enabled: tipo === "pagar",
  });

  const salvar = useMutation({
    mutationFn: async () => {
      const seq = tipo === "receber" ? "receivable_number_seq" : "payable_number_seq";
      // usa RPC-safe fallback: gerar numero client-side com timestamp para lançamentos manuais
      const numero =
        (tipo === "receber" ? "CR-M-" : "CP-M-") +
        Date.now().toString().slice(-8);

      const payload: any = {
        numero,
        descricao: form.descricao,
        valor_original: Number(form.valor),
        data_emissao: form.data_emissao,
        data_vencimento: form.data_vencimento,
        categoria_id: form.categoria_id || null,
        observacoes: form.observacoes || null,
      };
      if (tipo === "receber") {
        payload.client_id = form.client_id || null;
        const { data, error } = await supabase
          .from("accounts_receivable")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        return { id: data.id };
      } else {
        payload.supplier_id = form.supplier_id || null;
        const { data, error } = await supabase
          .from("accounts_payable")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        return { id: data.id };
      }
    },
    onSuccess: ({ id }) => {
      toast.success("Lançamento criado");
      navigate({
        to: tipo === "receber" ? "/financeiro/receber/$id" : "/financeiro/pagar/$id",
        params: { id },
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Novo lançamento financeiro"
        description="Registre uma conta a receber ou a pagar manualmente."
      />

      <Card className="p-6 max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvar.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receber">Conta a receber</SelectItem>
                <SelectItem value="pagar">Conta a pagar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descrição *</Label>
            <Input
              required
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Ex: Aluguel do escritório, Combustível da frota"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={form.categoria_id}
                onValueChange={(v) => setForm({ ...form, categoria_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razao_social ?? c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Emissão *</Label>
              <Input
                type="date"
                required
                value={form.data_emissao}
                onChange={(e) => setForm({ ...form, data_emissao: e.target.value })}
              />
            </div>
            <div>
              <Label>Vencimento *</Label>
              <Input
                type="date"
                required
                value={form.data_vencimento}
                onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
              />
            </div>
          </div>

          {tipo === "receber" ? (
            <div>
              <Label>Cliente</Label>
              <Select
                value={form.client_id}
                onValueChange={(v) => setForm({ ...form, client_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razao_social ?? c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label>Fornecedor</Label>
              <Select
                value={form.supplier_id}
                onValueChange={(v) => setForm({ ...form, supplier_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razao_social ?? c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando..." : "Criar lançamento"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
