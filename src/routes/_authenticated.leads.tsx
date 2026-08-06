import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Plus, ArrowRight } from "lucide-react";
import { formatDate, LEAD_ORIGIN_LABEL } from "@/lib/format";
import { LeadStatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { RowActions } from "@/components/RowActions";

export const Route = createFileRoute("/_authenticated/leads")({
  component: LeadsPage,
});

function LeadsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: leads = [] } = useQuery({
    queryKey: ["leads", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("leads")
        .select("*, clients(id, nome)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (v: any) => {
      const { id, ...rest } = v;
      if (id) {
        const { error } = await supabase.from("leads").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leads").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Lead salvo");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.rpc as any)("delete_lead", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead excluído");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Leads"
        description="Captação inicial de oportunidades. Registre a origem e converta em cliente."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo lead
          </Button>
        }
      />

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogContent>
          <LeadForm
            key={editing?.id ?? "novo"}
            initial={editing}
            onSubmit={(v) => save.mutate(v)}
            submitting={save.isPending}
          />
        </DialogContent>
      </Dialog>

      <div className="mb-4 flex items-center gap-2">
        <Label className="text-xs">Filtrar:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="em_diagnostico">Em diagnóstico</SelectItem>
            <SelectItem value="proposta_enviada">Proposta enviada</SelectItem>
            <SelectItem value="ganho">Ganho</SelectItem>
            <SelectItem value="perdido">Perdido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contato</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cliente vinculado</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-32"></TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="font-medium">{l.nome_contato}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.telefone || l.email || "—"}
                  </div>
                </TableCell>
                <TableCell>{LEAD_ORIGIN_LABEL[l.origem]}</TableCell>
                <TableCell>
                  <LeadStatusBadge status={l.status} />
                </TableCell>
                <TableCell>{l.clients?.nome ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(l.created_at)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/diagnosticos/novo" search={{ leadId: l.id }}>
                      Diagnóstico <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </TableCell>
                <TableCell>
                  <RowActions
                    onEdit={() => {
                      setEditing(l);
                      setOpen(true);
                    }}
                    onDelete={() => remove.mutate(l.id)}
                    deleting={remove.isPending}
                    label={`Excluir lead "${l.nome_contato}"?`}
                    description="Leads que já geraram diagnóstico não podem ser excluídos."
                  />
                </TableCell>
              </TableRow>
            ))}
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum lead cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function LeadForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: any;
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    id: initial?.id as string | undefined,
    nome_contato: initial?.nome_contato ?? "",
    telefone: initial?.telefone ?? "",
    email: initial?.email ?? "",
    origem: initial?.origem ?? "telefone",
    status: initial?.status ?? "novo",
    notas: initial?.notas ?? "",
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle>{initial ? "Editar lead" : "Novo lead"}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
        className="space-y-3"
      >
        <div>
          <Label>Nome do contato *</Label>
          <Input
            required
            value={form.nome_contato}
            onChange={(e) => setForm({ ...form, nome_contato: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Telefone</Label>
            <Input
              value={form.telefone ?? ""}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Origem</Label>
            <Select value={form.origem} onValueChange={(v) => setForm({ ...form, origem: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_ORIGIN_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="em_diagnostico">Em diagnóstico</SelectItem>
                <SelectItem value="proposta_enviada">Proposta enviada</SelectItem>
                <SelectItem value="ganho">Ganho</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Notas</Label>
          <Textarea
            value={form.notas ?? ""}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
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
