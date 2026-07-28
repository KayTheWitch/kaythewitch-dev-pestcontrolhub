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
import { Plus, AlertTriangle, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/estoque")({
  component: EstoquePage,
});

const MOVEMENT_LABEL: Record<string, string> = {
  entrada: "Entrada",
  saida_os: "Saída (OS)",
  ajuste: "Ajuste",
  transferencia: "Transferência",
};

function EstoquePage() {
  const qc = useQueryClient();
  const [openEntrada, setOpenEntrada] = useState(false);
  const [openAjuste, setOpenAjuste] = useState(false);

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

  const { data: lotes = [] } = useQuery({
    queryKey: ["product_batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_batches")
        .select("*, products(id, nome, unidade, min_stock)")
        .eq("active", true)
        .order("expiry_date", { nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: movimentos = [] } = useQuery({
    queryKey: ["stock_movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*, products(nome, unidade), product_batches(batch_number)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const saldos = useMemo(() => {
    const map = new Map<string, { nome: string; unidade: string; saldo: number; min: number }>();
    for (const p of produtos as any[]) {
      map.set(p.id, { nome: p.nome, unidade: p.unidade, saldo: 0, min: Number(p.min_stock ?? 0) });
    }
    for (const l of lotes as any[]) {
      const entry = map.get(l.product_id);
      if (entry) entry.saldo += Number(l.quantity_on_hand ?? 0);
    }
    return [...map.entries()].map(([id, v]) => ({ id, ...v }));
  }, [produtos, lotes]);

  const abaixoMinimo = saldos.filter((s) => s.min > 0 && s.saldo < s.min);
  const hoje = new Date();
  const em30 = new Date(hoje.getTime() + 30 * 86400000);
  const vencendo = (lotes as any[]).filter(
    (l) => l.expiry_date && new Date(l.expiry_date) <= em30 && Number(l.quantity_on_hand) > 0,
  );
  const vencidos = (lotes as any[]).filter(
    (l) => l.expiry_date && new Date(l.expiry_date) < hoje && Number(l.quantity_on_hand) > 0,
  );

  const entrada = useMutation({
    mutationFn: async (v: any) => {
      const { data: existing } = await supabase
        .from("product_batches")
        .select("id")
        .eq("product_id", v.product_id)
        .eq("batch_number", v.batch_number)
        .maybeSingle();

      let batchId = existing?.id as string | undefined;
      if (!batchId) {
        const { data, error } = await supabase
          .from("product_batches")
          .insert({
            product_id: v.product_id,
            batch_number: v.batch_number,
            expiry_date: v.expiry_date || null,
            unit_cost: v.unit_cost ? Number(v.unit_cost) : null,
            supplier_name: v.supplier_name || null,
          })
          .select("id")
          .single();
        if (error) throw error;
        batchId = data.id;
      }

      const { error: mErr } = await supabase.from("stock_movements").insert({
        product_id: v.product_id,
        batch_id: batchId,
        movement_type: "entrada",
        quantity: Number(v.quantity),
        reason: v.reason || "Entrada manual de estoque",
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      toast.success("Entrada registrada");
      qc.invalidateQueries({ queryKey: ["product_batches"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      setOpenEntrada(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const ajuste = useMutation({
    mutationFn: async (v: any) => {
      const lote = (lotes as any[]).find((l) => l.id === v.batch_id);
      if (!lote) throw new Error("Lote não encontrado");
      const { error } = await supabase.from("stock_movements").insert({
        product_id: lote.product_id,
        batch_id: lote.id,
        movement_type: "ajuste",
        quantity: Number(v.quantity),
        reason: v.reason || "Ajuste manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ajuste registrado");
      qc.invalidateQueries({ queryKey: ["product_batches"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      setOpenAjuste(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Estoque"
        description="Saldos por lote, validades, alertas de mínimo e histórico de movimentações."
        actions={
          <>
            <Dialog open={openAjuste} onOpenChange={setOpenAjuste}>
              <DialogTrigger asChild>
                <Button variant="outline">Ajuste</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajuste de saldo</DialogTitle>
                </DialogHeader>
                <AjusteForm
                  lotes={lotes as any[]}
                  submitting={ajuste.isPending}
                  onSubmit={(v) => ajuste.mutate(v)}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={openEntrada} onOpenChange={setOpenEntrada}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Entrada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Entrada de estoque</DialogTitle>
                </DialogHeader>
                <EntradaForm
                  produtos={produtos as any[]}
                  submitting={entrada.isPending}
                  onSubmit={(v) => entrada.mutate(v)}
                />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Kpi label="Produtos abaixo do mínimo" value={abaixoMinimo.length} tone="warning" />
        <Kpi label="Lotes vencendo em 30 dias" value={vencendo.length} tone="warning" />
        <Kpi label="Lotes vencidos com saldo" value={vencidos.length} tone="destructive" />
      </div>

      <Tabs defaultValue="saldos">
        <TabsList>
          <TabsTrigger value="saldos">Saldos</TabsTrigger>
          <TabsTrigger value="lotes">Lotes</TabsTrigger>
          <TabsTrigger value="movimentos">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="saldos">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saldos.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell className="text-right">
                      {s.saldo} {s.unidade}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{s.min}</TableCell>
                    <TableCell>
                      {s.min > 0 && s.saldo < s.min ? (
                        <Badge variant="outline" className="bg-warning/15 text-warning-foreground border-warning/30">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Repor
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-success/15 text-success border-success/30">
                          Adequado
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="lotes">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Fornecedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(lotes as any[]).map((l) => {
                  const vencido = l.expiry_date && new Date(l.expiry_date) < hoje;
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.products?.nome}</TableCell>
                      <TableCell>{l.batch_number}</TableCell>
                      <TableCell className={vencido ? "text-destructive" : ""}>
                        {formatDate(l.expiry_date)}
                      </TableCell>
                      <TableCell className="text-right">
                        {l.quantity_on_hand} {l.products?.unidade}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {l.supplier_name ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="movimentos">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(movimentos as any[]).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">{formatDateTime(m.created_at)}</TableCell>
                    <TableCell className="font-medium">{m.products?.nome}</TableCell>
                    <TableCell>{m.product_batches?.batch_number ?? "—"}</TableCell>
                    <TableCell>{MOVEMENT_LABEL[m.movement_type] ?? m.movement_type}</TableCell>
                    <TableCell
                      className={`text-right ${Number(m.quantity) < 0 ? "text-destructive" : "text-success"}`}
                    >
                      {Number(m.quantity) > 0 ? "+" : ""}
                      {m.quantity} {m.products?.unidade}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.reason ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {movimentos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <PackageSearch className="w-5 h-5 mx-auto mb-2" />
                      Nenhuma movimentação registrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`text-2xl font-semibold mt-1 ${
          value > 0 && tone === "destructive"
            ? "text-destructive"
            : value > 0 && tone === "warning"
              ? "text-warning-foreground"
              : ""
        }`}
      >
        {value}
      </div>
    </Card>
  );
}

function EntradaForm({
  produtos,
  onSubmit,
  submitting,
}: {
  produtos: any[];
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [v, setV] = useState<any>({
    product_id: "",
    batch_number: "",
    expiry_date: "",
    quantity: "",
    unit_cost: "",
    supplier_name: "",
    reason: "",
  });
  const set = (k: string, val: any) => setV((s: any) => ({ ...s, [k]: val }));

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.product_id || !v.batch_number || !v.quantity) {
          toast.error("Produto, lote e quantidade são obrigatórios");
          return;
        }
        onSubmit(v);
      }}
    >
      <div>
        <Label>Produto</Label>
        <Select value={v.product_id} onValueChange={(val) => set("product_id", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {produtos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
        <Label>Fornecedor (texto livre)</Label>
        <Input value={v.supplier_name} onChange={(e) => set("supplier_name", e.target.value)} />
      </div>
      <div>
        <Label>Motivo</Label>
        <Textarea value={v.reason} onChange={(e) => set("reason", e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          Registrar entrada
        </Button>
      </DialogFooter>
    </form>
  );
}

function AjusteForm({
  lotes,
  onSubmit,
  submitting,
}: {
  lotes: any[];
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [v, setV] = useState<any>({ batch_id: "", quantity: "", reason: "" });
  const set = (k: string, val: any) => setV((s: any) => ({ ...s, [k]: val }));

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.batch_id || !v.quantity) {
          toast.error("Informe o lote e a quantidade");
          return;
        }
        onSubmit(v);
      }}
    >
      <div>
        <Label>Lote</Label>
        <Select value={v.batch_id} onValueChange={(val) => set("batch_id", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {lotes.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.products?.nome} — {l.batch_number} (saldo {l.quantity_on_hand})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Quantidade (use valor negativo para baixa)</Label>
        <Input type="number" step="0.01" value={v.quantity} onChange={(e) => set("quantity", e.target.value)} />
      </div>
      <div>
        <Label>Motivo</Label>
        <Textarea value={v.reason} onChange={(e) => set("reason", e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          Registrar ajuste
        </Button>
      </DialogFooter>
    </form>
  );
}
