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

export const Route = createFileRoute("/_authenticated/compliance/epis")({
  component: EpiDeliveriesPage,
});

function EpiDeliveriesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["epi_deliveries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("epi_deliveries")
        .select("*, epis(nome, ca)")
        .order("entregue_em", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
      return data ?? [];
    },
  });

  const { data: epis = [] } = useQuery({
    queryKey: ["epis"],
    queryFn: async () => {
      const { data } = await supabase.from("epis").select("id, nome, ca").eq("ativo", true).order("nome");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (v: any) => {
      let ficha_pdf_path: string | null = null;
      if (v._file instanceof File) {
        const path = `epi/${crypto.randomUUID()}-${v._file.name}`;
        const up = await supabase.storage.from("compliance-docs").upload(path, v._file);
        if (up.error) throw up.error;
        ficha_pdf_path = path;
      }
      const { _file, ...rest } = v;
      const { error } = await supabase.from("epi_deliveries").insert({ ...rest, ficha_pdf_path });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entrega registrada");
      qc.invalidateQueries({ queryKey: ["epi_deliveries"] });
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
        title="Entrega de EPIs"
        description="Ficha de entrega de equipamentos de proteção por técnico, com CA e validade."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova entrega
              </Button>
            </DialogTrigger>
            <DialogContent>
              <Form
                users={users as any}
                epis={epis as any}
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
              <TableHead>Técnico</TableHead>
              <TableHead>EPI</TableHead>
              <TableHead>CA</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Ficha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => {
              const u = users.find((x: any) => x.id === r.user_id);
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">
                    {new Date(r.entregue_em).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm">{u?.full_name ?? u?.email ?? "—"}</TableCell>
                  <TableCell className="text-sm">{r.epis?.nome}</TableCell>
                  <TableCell className="text-sm">{r.ca || r.epis?.ca || "—"}</TableCell>
                  <TableCell className="text-sm">{r.quantidade}</TableCell>
                  <TableCell className="text-sm">{r.validade || "—"}</TableCell>
                  <TableCell>
                    {r.ficha_pdf_path ? (
                      <Button size="sm" variant="ghost" onClick={() => download(r.ficha_pdf_path)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma entrega registrada.
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
  users,
  epis,
  onSubmit,
  submitting,
}: {
  users: any[];
  epis: any[];
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [f, setF] = useState<any>({
    user_id: "",
    epi_id: "",
    ca: "",
    quantidade: 1,
    entregue_em: new Date().toISOString().slice(0, 10),
    validade: "",
    _file: null,
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova entrega de EPI</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            ...f,
            validade: f.validade || null,
            ca: f.ca || null,
          });
        }}
        className="space-y-3"
      >
        <div>
          <Label>Técnico *</Label>
          <Select value={f.user_id} onValueChange={(v) => setF({ ...f, user_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>EPI *</Label>
          <Select value={f.epi_id} onValueChange={(v) => setF({ ...f, epi_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {epis.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome} {e.ca ? `(CA ${e.ca})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>CA (opc.)</Label>
            <Input value={f.ca} onChange={(e) => setF({ ...f, ca: e.target.value })} />
          </div>
          <div>
            <Label>Quantidade *</Label>
            <Input
              type="number"
              min="1"
              step="1"
              required
              value={f.quantidade}
              onChange={(e) => setF({ ...f, quantidade: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Validade</Label>
            <Input
              type="date"
              value={f.validade}
              onChange={(e) => setF({ ...f, validade: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Entregue em *</Label>
          <Input
            type="date"
            required
            value={f.entregue_em}
            onChange={(e) => setF({ ...f, entregue_em: e.target.value })}
          />
        </div>
        <div>
          <Label>Ficha assinada (PDF)</Label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setF({ ...f, _file: e.target.files?.[0] ?? null })}
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting || !f.user_id || !f.epi_id}>
            {submitting ? "Salvando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
