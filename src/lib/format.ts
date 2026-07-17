export const formatCurrency = (v: number | string | null | undefined) => {
  const n = typeof v === "string" ? parseFloat(v) : (v ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
};

export const formatDate = (v: string | Date | null | undefined) => {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
};

export const formatDateTime = (v: string | Date | null | undefined) => {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
};

export const SERVICE_TYPE_LABEL: Record<string, string> = {
  controle_pragas: "Controle de pragas",
  higienizacao_reservatorio: "Higienização de reservatório",
};

export const CATEGORY_LABEL: Record<string, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  industrial: "Industrial",
  condominio: "Condomínio",
};

export const LEAD_ORIGIN_LABEL: Record<string, string> = {
  telefone: "Telefone",
  whatsapp: "WhatsApp",
  site: "Site",
  email: "E-mail",
  indicacao: "Indicação",
  retorno: "Retorno",
};

export const LEAD_STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  em_diagnostico: "Em diagnóstico",
  proposta_enviada: "Proposta enviada",
  ganho: "Ganho",
  perdido: "Perdido",
};

export const PROPOSAL_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  em_assinatura: "Em assinatura",
  aprovada: "Aprovada",
  recusada: "Recusada",
  expirada: "Expirada",
};

export const OS_STATUS_LABEL: Record<string, string> = {
  aguardando_execucao: "Aguardando execução",
  em_execucao: "Em execução",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const URGENCY_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const FINANCIAL_STATUS_LABEL: Record<string, string> = {
  aberto: "Em aberto",
  parcialmente_pago: "Parcial",
  pago: "Pago",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pix: "PIX",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
};

export const FINANCIAL_CATEGORY_TYPE_LABEL: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
};
