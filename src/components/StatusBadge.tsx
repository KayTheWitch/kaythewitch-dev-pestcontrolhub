import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PROPOSAL_STATUS_LABEL,
  OS_STATUS_LABEL,
  LEAD_STATUS_LABEL,
} from "@/lib/format";

const proposalColors: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviada: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  em_assinatura: "bg-warning/15 text-warning-foreground border-warning/30",
  aprovada: "bg-success/15 text-success border-success/30",
  recusada: "bg-destructive/15 text-destructive border-destructive/30",
  expirada: "bg-muted text-muted-foreground",
};
const osColors: Record<string, string> = {
  aguardando_execucao: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  em_execucao: "bg-warning/15 text-warning-foreground border-warning/30",
  concluida: "bg-success/15 text-success border-success/30",
  cancelada: "bg-destructive/15 text-destructive border-destructive/30",
};
const leadColors: Record<string, string> = {
  novo: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  em_diagnostico: "bg-warning/15 text-warning-foreground border-warning/30",
  proposta_enviada: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  ganho: "bg-success/15 text-success border-success/30",
  perdido: "bg-destructive/15 text-destructive border-destructive/30",
};

export function ProposalStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", proposalColors[status])}>
      {PROPOSAL_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function OsStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", osColors[status])}>
      {OS_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function LeadStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", leadColors[status])}>
      {LEAD_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
