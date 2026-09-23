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
  ativo: boolean;
};

export type Executive = {
  id: string;
  nome: string;
  nomeRelatorio: string;
  nomeNormalizado: string;
  equipeId: string | null;
  fotoDataUrl?: string;
  ativo: boolean;
};

export type ReportRow = {
  nomeAssociado: string;
  placa: string;
  tipoVeiculo: string;
  cooperativa: string;
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
};

export type RankingEntry = {
  position: number;
  executiveId?: string;
  name: string;
  normalizedName: string;
  teamId: string | null;
  team: string;
  plates: number;
  revenue: number;
  movement: number;
  newAdhesions: number;
};

export type TeamRankingEntry = {
  position: number;
  teamId: string;
  team: string;
  plates: number;
  revenue: number;
  members: number;
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
