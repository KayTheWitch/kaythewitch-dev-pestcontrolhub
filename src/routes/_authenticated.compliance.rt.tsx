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
import { Plus, Upload, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/compliance/rt")({
  component: RtPage,
});

type Rt = {
  id: string;
  nome: string;
  conselho: string;
  registro: string;
  art_numero: string | null;
  art_validade: string | null;
  art_pdf_path: string | null;
  ativo: boolean;
};

function RtPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["technical_responsibles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("technical_responsibles")
        .select("*")
        .order("ativo", { ascending: false })
        .order("nome");
      return (data ?? []) as Rt[];
    },
  });

  const create = useMutation({
    mutationFn: async (v: any) => {
      let art_pdf_path: string | null = null;
      if (v._file instanceof File) {
        const path = `art/${crypto.randomUUID()}-${v._file.name}`;
        const up = await supabase.storage.from("compliance-docs").upload(path, v._file);
        if (up.error) throw up.error;
        art_pdf_path = path;
      }
      const { _file, ...rest } = v;
      const { error } = await supabase
        .from("technical_responsibles")
        .insert({ ...rest, art_pdf_path });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("RT cadastrado");
      qc.invalidateQueries({ queryKey: ["technical_responsibles"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("technical_responsibles")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["technical_responsibles"] }),
  });

  async function download(path: string) {
    const { data, error } = await supabase.storage.from("compliance-docs").createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Responsáveis Técnicos"
        description="Cadastro de RTs, ART e conselho profissional. Ao concluir uma OS, o sistema tira snapshot do RT vigente para o CES."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo RT
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
              <TableHead>Conselho / registro</TableHead>
              <TableHead>ART</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="w-24">Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const vencido = r.art_validade && r.art_validade < today;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-sm">
                    {r.conselho} {r.registro}
                  </TableCell>
                  <TableCell className="text-sm">{r.art_numero || "—"}</TableCell>
                  <TableCell className={`text-sm ${vencido ? "text-destructive font-medium" : ""}`}>
                    {r.art_validade || "—"} {vencido ? "(vencida)" : ""}
                  </TableCell>
                  <TableCell>
                    {r.art_pdf_path ? (
                      <Button size="sm" variant="ghost" onClick={() => download(r.art_pdf_path!)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={r.ativo}
                      onCheckedChange={(v) => toggle.mutate({ id: r.id, ativo: v })}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum RT cadastrado ainda.
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
  onSubmit,
  submitting,
}: {
  onSubmit: (v: any) => void;
  submitting: boolean;
}) {
  const [f, setF] = useState<any>({
    nome: "",
    conselho: "CREA",
    registro: "",
    art_numero: "",
    art_validade: "",
    _file: null,
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle>Novo Responsável Técnico</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            ...f,
            art_validade: f.art_validade || null,
          });
        }}
        className="space-y-3"
      >
        <div>
          <Label>Nome *</Label>
          <Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Conselho *</Label>
            <Select value={f.conselho} onValueChange={(v) => setF({ ...f, conselho: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["CREA", "CRQ", "CRBio", "CRMV", "Outro"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Registro *</Label>
            <Input
              required
              value={f.registro}
              onChange={(e) => setF({ ...f, registro: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Nº da ART</Label>
            <Input
              value={f.art_numero}
              onChange={(e) => setF({ ...f, art_numero: e.target.value })}
            />
          </div>
          <div>
            <Label>Validade da ART</Label>
            <Input
              type="date"
              value={f.art_validade}
              onChange={(e) => setF({ ...f, art_validade: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label className="flex items-center gap-2">
            <Upload className="w-4 h-4" /> PDF da ART
          </Label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setF({ ...f, _file: e.target.files?.[0] ?? null })}
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
