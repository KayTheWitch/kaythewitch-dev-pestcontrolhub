import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { PAYMENT_METHOD_LABEL, formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export function PaymentDialog({
  open,
  onOpenChange,
  tipo,
  accountId,
  saldo,
  numero,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipo: "receber" | "pagar";
  accountId: string;
  saldo: number;
  numero: string;
}) {
  const qc = useQueryClient();
  const [valor, setValor] = useState<string>(saldo.toFixed(2));
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [forma, setForma] = useState<string>("pix");
  const [obs, setObs] = useState("");

  const baixar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("register_financial_payment", {
        _tipo: tipo,
        _account_id: accountId,
        _valor: Number(valor),
        _data_pagamento: data,
        _forma: forma as any,
        _obs: obs || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pagamento registrado");
      qc.invalidateQueries();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Baixar {tipo === "receber" ? "recebimento" : "pagamento"} · {numero}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Saldo em aberto: <b>{formatCurrency(saldo)}</b>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={saldo}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Forma de pagamento *</Label>
            <Select value={forma} onValueChange={setForma}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => baixar.mutate()}
            disabled={baixar.isPending || Number(valor) <= 0 || Number(valor) > saldo}
          >
            {baixar.isPending ? "Registrando..." : "Registrar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
