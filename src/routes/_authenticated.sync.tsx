import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Cloud,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteOsCache,
  deleteQueueItem,
  listOsCache,
  listQueue,
  storageUsage,
  type CachedOs,
  type QueueItem,
} from "@/lib/offline/db";
import { formatBytes } from "@/lib/offline/image";
import { processQueue, retryItem, subscribeSync } from "@/lib/offline/sync";
import { prepareTodayOs } from "@/lib/offline/os-offline";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/sync")({
  component: SyncPage,
});

const STATUS_LABEL: Record<QueueItem["status"], string> = {
  pendente: "Pendente",
  processando: "Enviando",
  erro: "Falha de rede",
  conflito: "Conflito",
  concluido: "Sincronizado",
};

function SyncPage() {
  const { online, lastSyncAt } = useOfflineStatus();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [cache, setCache] = useState<CachedOs[]>([]);
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setItems(await listQueue());
      setCache(await listOsCache());
      setUsage(await storageUsage());
    } catch {
      /* IndexedDB indisponível */
    }
  }

  useEffect(() => {
    void load();
    return subscribeSync(() => void load());
  }, []);

  const pendentes = items.filter((i) => i.status !== "concluido");

  return (
    <>
      <PageHeader
        title="Sincronização"
        description="Execuções registradas em campo aguardando envio ao servidor."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy || !online}
              onClick={async () => {
                setBusy(true);
                try {
                  const n = await prepareTodayOs();
                  toast.success(`${n} OS preparada(s) para uso offline.`);
                  await load();
                } catch (e: any) {
                  toast.error(e?.message ?? "Falha ao preparar OS.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Preparar OS do dia
            </Button>
            <Button
              size="sm"
              disabled={busy || !online || pendentes.length === 0}
              onClick={async () => {
                setBusy(true);
                await processQueue({ force: true });
                await load();
                setBusy(false);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar agora
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            {online ? (
              <Cloud className="w-4 h-4 text-primary" />
            ) : (
              <CloudOff className="w-4 h-4 text-destructive" />
            )}
            {online ? "Conectado" : "Sem conexão"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Última sincronização: {lastSyncAt ? formatDateTime(lastSyncAt) : "—"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium">{pendentes.length} pendente(s)</div>
          <div className="text-xs text-muted-foreground mt-1">
            {items.filter((i) => i.status === "conflito").length} em conflito
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium">{cache.length} OS em cache</div>
          <div className="text-xs text-muted-foreground mt-1">
            {usage ? `${formatBytes(usage.usage)} usados no aparelho` : "Uso indisponível"}
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OS</TableHead>
              <TableHead>Registrada em</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Detalhe</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const stale =
                item.status !== "concluido" &&
                Date.now() - new Date(item.createdAt).getTime() > 86400000;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <Link to="/os/$id" params={{ id: item.osId }} className="hover:underline">
                      #{item.numero}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{formatDateTime(item.createdAt)}</TableCell>
                  <TableCell className="text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      {item.status === "concluido" ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : item.status === "conflito" || stale ? (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      ) : null}
                      {STATUS_LABEL[item.status]}
                    </span>
                    {stale && (
                      <div className="text-xs text-destructive">Parado há mais de 24h</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-sm">
                    {item.lastError ?? `${item.payload.produtos.length} produto(s), ${item.payload.photoIds.length} foto(s)`}
                    {item.attempts > 0 && ` · ${item.attempts} tentativa(s)`}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.status !== "concluido" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!online || busy}
                          onClick={async () => {
                            setBusy(true);
                            await retryItem(item);
                            await load();
                            setBusy(false);
                          }}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await deleteQueueItem(item.id);
                          await load();
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nada na fila de sincronização.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <div className="px-5 pt-5 font-semibold">OS disponíveis offline</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OS</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Baixada em</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cache.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">#{c.numero}</TableCell>
                <TableCell>{c.client?.nome ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(c.cachedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/os/$id/campo" params={{ id: c.id }}>
                        Executar
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deleteOsCache(c.id);
                        await load();
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {cache.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Nenhuma OS preparada para offline.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
