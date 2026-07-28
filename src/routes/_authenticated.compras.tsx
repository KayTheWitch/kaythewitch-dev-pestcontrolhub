import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Plus, Trash2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/compras")({
  component: ComprasPage,
});

const PO_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  confirmado: "Confirmado",
  recebido_parcial: "Recebido parcial",
  recebido: "Recebido",
  cancelado: "Cancelado",
};

const PO_STATUS_COLOR: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  confirmado: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  recebido_parcial: "bg-warning/15 text-warning-foreground border-warning/30",
  recebido: "bg-success/15 text-success border-success/30",
  cancelado: "bg-destructive/15 text-destructive border-destructive/30",
};

function ComprasPage() {
  const qc = useQueryClient();
  const [openNovo, setOpenNovo] = useState(false);
  const [detalhe, setDetalhe] = useState<any>(null);

  const { data: pedidos = [] } = useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, suppliers(id, razao_social)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["suppliers", "ativos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("suppliers")
        .select("id, razao_social")
        .eq("ativo", true)
        .order("razao_social");
      return data ?? [];
    },
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ["products", "ativos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, nome, unidade, min_stock")
        .eq("ativo", true)
        .order("nome");
      return data ?? [];
    },
  });

  const { data: criticos = [] } = useQuery({
    queryKey: ["bi_stock_critical"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("bi_stock_critical");
      if (error) throw error;
      return data ?? [];
    },
  });

  const sugestoes = useMemo(
    () =>
      (criticos as any[]).filter(
        (c) => Number(c.min_stock) > 0 && Number(c.saldo) < Number(c.min_stock),
      ),
    [criticos],
  );

  const criar = useMutation({
    mutationFn: async (v: any) => {
      const numero = `PC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const { data: po, error } = await supabase
        .from("purchase_orders")
        .insert({
          numero,
          supplier_id: v.supplier_id,
          data_pedido: v.data_pedido,
          data_prevista: v.data_prevista || null,
          condicao_pagamento: v.condicao_pagamento || null,
          observacoes: v.observacoes || null,
          status: "rascunho" as const,
        })
        .select("id")
        .single();
      if (error) throw error;

      const itens = v.itens.map((i: any) => ({
        purchase_order_id: po.id,
        product_id: i.product_id,
        quantidade: Number(i.quantidade),
        custo_unitario: Number(i.custo_unitario || 0),
      }));
      if (itens.length > 0) {
        const { error: iErr } = await supabase.from("purchase_order_items").insert(itens);
        if (iErr) throw iErr;
      }
    },
    onSuccess: () => {
      toast.success("Pedido de compra criado");
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      setOpenNovo(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const mudarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Compras"
        description="Pedidos de compra, recebimento com entrada de lote e sugestão de reposição."
        actions={
          <Dialog open={openNovo} onOpenChange={setOpenNovo}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Novo pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Novo pedido de compra</DialogTitle>
              </DialogHeader>
              <PoForm
                fornecedores={fornecedores as any[]}
                produtos={produtos as any[]}
                submitting={criar.isPending}
                onSubmit={(v) => criar.mutate(v)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="reposicao">Sugestão de reposição ({sugestoes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pedidos as any[]).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.numero}</TableCell>
                    <TableCell>{p.suppliers?.razao_social ?? "—"}</TableCell>
                    <TableCell>{formatDate(p.data_pedido)}</TableCell>
                    <TableCell>{formatDate(p.data_prevista)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.total)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={PO_STATUS_COLOR[p.status]}>
                        {PO_STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {p.status === "rascunho" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => mudarStatus.mutate({ id: p.id, status: "enviado" })}
                        >
                          Enviar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setDetalhe(p)}>
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pedidos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum pedido de compra registrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="reposicao">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Sugerido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sugestoes.map((s: any) => (
                  <TableRow key={s.product_id}>
                    <TableCell className="font-medium">{s.produto}</TableCell>
                    <TableCell className="text-right">{s.saldo}</TableCell>
                    <TableCell className="text-right">{s.min_stock}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Math.max(0, Number(s.min_stock) * 2 - Number(s.saldo))}
                    </TableCell>
                  </TableRow>
                ))}
                {sugestoes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum produto abaixo do estoque mínimo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pedido {detalhe?.numero}</DialogTitle>
          </DialogHeader>
          {detalhe && <PoDetail po={detalhe} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PoDetail({ po }: { po: any }) {
  const qc = useQueryClient();
  const [receber, setReceber] = useState<any>(null);

  const { data: itens = [] } = useQuery({
    queryKey: ["purchase_order_items", po.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select("*, products(nome, unidade)")
        .eq("purchase_order_id", po.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const receberItem = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.rpc("receive_purchase_order_item", {
        _item_id: v.item_id,
        _batch_number: v.batch_number,
        _expiry_date: v.expiry_date || null,
        _quantity: Number(v.quantity),
        _unit_cost: Number(v.unit_cost || 0),
        _reason: v.reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recebimento registrado e estoque atualizado");
      qc.invalidateQueries({ queryKey: ["purchase_order_items", po.id] });
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      qc.invalidateQueries({ queryKey: ["product_batches"] });
      setReceber(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Fornecedor: </span>
          {po.suppliers?.razao_social ?? "—"}
        </div>
        <div>
          <span className="text-muted-foreground">Previsão: </span>
          {formatDate(po.data_prevista)}
        </div>
        <div>
          <span className="text-muted-foreground">Total: </span>
          {formatCurrency(po.total)}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Pedido</TableHead>
            <TableHead className="text-right">Recebido</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(itens as any[]).map((i) => (
            <TableRow key={i.id}>
              <TableCell className="font-medium">{i.products?.nome}</TableCell>
              <TableCell className="text-right">
                {i.quantidade} {i.products?.unidade}
              </TableCell>
              <TableCell className="text-right">{i.quantidade_recebida}</TableCell>
              <TableCell className="text-right">{formatCurrency(i.custo_unitario)}</TableCell>
              <TableCell>
                {Number(i.quantidade_recebida) < Number(i.quantidade) && (
                  <Button size="sm" variant="outline" onClick={() => setReceber(i)}>
                    <PackageCheck className="w-4 h-4 mr-1" /> Receber
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!receber} onOpenChange={(o) => !o && setReceber(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receber {receber?.products?.nome}</DialogTitle>
          </DialogHeader>
          {receber && (
            <ReceiveForm
              item={receber}
              submitting={receberItem.isPending}
              onSubmit={(v) => receberItem.mutate({ ...v, item_id: receber.id })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReceiveForm({
  item,
  onSubmit,
  submitting,
}: {
  item: any;
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const restante = Number(item.quantidade) - Number(item.quantidade_recebida);
  const [v, setV] = useState<any>({
    batch_number: "",
    expiry_date: "",
    quantity: String(restante),
    unit_cost: String(item.custo_unitario ?? ""),
    reason: "",
  });
  const set = (k: string, val: any) => setV((s: any) => ({ ...s, [k]: val }));

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.batch_number || !v.quantity) {
          toast.error("Informe lote e quantidade");
          return;
        }
        onSubmit(v);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Lote</Label>
          <Input value={v.batch_number} onChange={(e) => set("batch_number", e.target.value)} />
        </div>
        <div>
          <Label>Validade</Label>
          <Input type="date" value={v.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} />
        </div>
        <div>
          <Label>Quantidade</Label>
          <Input type="number" step="0.01" value={v.quantity} onChange={(e) => set("quantity", e.target.value)} />
        </div>
        <div>
          <Label>Custo unitário</Label>
          <Input type="number" step="0.01" value={v.unit_cost} onChange={(e) => set("unit_cost", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Observação</Label>
        <Input value={v.reason} onChange={(e) => set("reason", e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          Confirmar recebimento
        </Button>
      </DialogFooter>
    </form>
  );
}

function PoForm({
  fornecedores,
  produtos,
  onSubmit,
  submitting,
}: {
  fornecedores: any[];
  produtos: any[];
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [v, setV] = useState<any>({
    supplier_id: "",
    data_pedido: hoje,
    data_prevista: "",
    condicao_pagamento: "",
    observacoes: "",
    itens: [{ product_id: "", quantidade: "", custo_unitario: "" }],
  });
  const set = (k: string, val: any) => setV((s: any) => ({ ...s, [k]: val }));
  const setItem = (i: number, k: string, val: any) =>
    setV((s: any) => ({
      ...s,
      itens: s.itens.map((it: any, idx: number) => (idx === i ? { ...it, [k]: val } : it)),
    }));

  const total = v.itens.reduce(
    (acc: number, i: any) => acc + Number(i.quantidade || 0) * Number(i.custo_unitario || 0),
    0,
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const itens = v.itens.filter((i: any) => i.product_id && Number(i.quantidade) > 0);
        if (!v.supplier_id || itens.length === 0) {
          toast.error("Selecione o fornecedor e ao menos um item");
          return;
        }
        onSubmit({ ...v, itens });
      }}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Fornecedor</Label>
          <Select value={v.supplier_id} onValueChange={(val) => set("supplier_id", val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {fornecedores.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Condição de pagamento</Label>
          <Input
            value={v.condicao_pagamento}
            onChange={(e) => set("condicao_pagamento", e.target.value)}
          />
        </div>
        <div>
          <Label>Data do pedido</Label>
          <Input type="date" value={v.data_pedido} onChange={(e) => set("data_pedido", e.target.value)} />
        </div>
        <div>
          <Label>Previsão de entrega</Label>
          <Input
            type="date"
            value={v.data_prevista}
            onChange={(e) => set("data_prevista", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Itens</Label>
        {v.itens.map((it: any, i: number) => (
          <div key={i} className="grid grid-cols-[1fr_100px_120px_40px] gap-2 items-end">
            <Select value={it.product_id} onValueChange={(val) => setItem(i, "product_id", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                {produtos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="0.01"
              placeholder="Qtd."
              value={it.quantidade}
              onChange={(e) => setItem(i, "quantidade", e.target.value)}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Custo un."
              value={it.custo_unitario}
              onChange={(e) => setItem(i, "custo_unitario", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                set(
                  "itens",
                  v.itens.filter((_: any, idx: number) => idx !== i),
                )
              }
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => set("itens", [...v.itens, { product_id: "", quantidade: "", custo_unitario: "" }])}
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar item
        </Button>
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea value={v.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </div>

      <div className="text-right text-sm">
        <span className="text-muted-foreground">Total estimado: </span>
        <span className="font-semibold">{formatCurrency(total)}</span>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          Criar pedido
        </Button>
      </DialogFooter>
    </form>
  );
}
