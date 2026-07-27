import { Link } from "@tanstack/react-router";
import { Cloud, CloudOff, RefreshCw, AlertTriangle } from "lucide-react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

export function OfflineIndicator({ compact = false }: { compact?: boolean }) {
  const { online, pendentes, conflitos, running, oldestAt, lastSyncAt } = useOfflineStatus();
  const total = pendentes + conflitos;
  const stale =
    !!oldestAt && Date.now() - new Date(oldestAt).getTime() > 24 * 60 * 60 * 1000;

  const Icon = running ? RefreshCw : online ? Cloud : CloudOff;

  return (
    <Link
      to="/sync"
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent/60",
        compact && "px-1.5",
      )}
      title={
        lastSyncAt ? `Última sincronização: ${formatDateTime(lastSyncAt)}` : "Sem sincronização registrada"
      }
    >
      <Icon
        className={cn(
          "w-4 h-4 shrink-0",
          running && "animate-spin",
          !online && "text-destructive",
          online && !running && "text-muted-foreground",
        )}
      />
      {!compact && (
        <span className="truncate">
          {running ? "Sincronizando..." : online ? "Online" : "Offline"}
        </span>
      )}
      {total > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            conflitos > 0 || stale
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground",
          )}
        >
          {total}
        </span>
      )}
      {stale && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
    </Link>
  );
}
