export type UserRole = "DEV" | "ADMIN";

export type AppUser = {
  uid: string;
  nome: string;
  email: string;
  perfil: UserRole;
  ativo: boolean;
  demo?: boolean;
};

export type Team = {
  id: string;
  nome: string;
  codigoCooperativa?: string;
  nomeRelatorio?: string;
  configurada?: boolean;
  ativo: boolean;
};

export type Executive = {
  id: string;
  nome: string;
  nomeArte?: string;
  nomeRelatorio: string;
  nomeNormalizado: string;
  equipeId: string | null;
  fotoDataUrl?: string;
  fotoPosicaoX?: number;
  fotoPosicaoY?: number;
  fotoZoom?: number;
  ativo: boolean;
};

export type ReportRow = {
  nomeAssociado: string;
  placa: string;
  tipoVeiculo: string;
  cooperativa: string;
  cooperativaCodigo: string;
  executivo: string;
  executivoNormalizado: string;
  situacao: string;
  situacaoNormalizada: string;
  dataContrato: string;
  tipoAdesao: string;
  tipoAdesaoNormalizado: string;
  previsao: number;
  chassi: string;
};

export type ParsedReport = {
  fileName: string;
  fileHash: string;
  rows: ReportRow[];
  totalRows: number;
  duplicateRows: number;
  missingPlates: number;
  periodStart: string;
  periodEnd: string;
  generatedAt?: string;
  generatedBy?: string;
  statusCounts: Record<string, number>;
  adhesionCounts: Record<string, number>;
  vehicleTypeCounts: Record<string, number>;
  sourceReports?: SourceReportSummary[];
  crossSourceDuplicates?: number;
};

export type ReportSystem = "LEVES" | "TRUCK";

export type SourceReportSummary = {
  system: ReportSystem;
  fileName: string;
  fileHash: string;
  totalRows: number;
  duplicateRows: number;
  missingPlates: number;
  periodStart: string;
  periodEnd: string;
  statusCounts: Record<string, number>;
};

export type RankingEntry = {
  position: number;
  executiveId?: string;
  name: string;
  normalizedName: string;
  teamId: string | null;
  team: string;
  cooperativeCodes: string[];
  plates: number;
  revenue: number;
  averageTicket: number;
  movement: number;
  newAdhesions: number;
};

export type TeamRankingEntry = {
  position: number;
  teamId: string;
  cooperativeCode: string;
  team: string;
  plates: number;
  revenue: number;
  averageTicket: number;
  members: number;
  movement: number;
};

export type Ranking = {
  id: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  createdAt?: unknown;
  createdByName: string;
  importId: string;
  fileName: string;
  totalVehicles: number;
  totalRevenue: number;
  totalExecutives: number;
  statusCounts: Record<string, number>;
  entries: RankingEntry[];
  teamEntries: TeamRankingEntry[];
};
