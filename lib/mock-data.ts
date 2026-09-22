import type { RankingEntry } from "./types";

export const rankingPreview: RankingEntry[] = [
  { position: 1, name: "Ivisson Diego", team: "Sentinelas", plates: 28, revenue: 5800, movement: 2 },
  { position: 2, name: "Anderson Tabosa", team: "Maná", plates: 24, revenue: 4938, movement: -1 },
  { position: 3, name: "Rômulo de Moura", team: "Arapiraca", plates: 21, revenue: 4217, movement: 0 },
  { position: 4, name: "Lucas Ferreira", team: "Sentinelas", plates: 20, revenue: 3980, movement: 1 },
  { position: 5, name: "Marcos Vinícius", team: "Elite GPV", plates: 18, revenue: 3615, movement: -2 },
];

export const dashboardMetrics = [
  { label: "Placas no fechamento", value: "164", detail: "+18 desde o anterior", tone: "positive" },
  { label: "Executivos ativos", value: "32", detail: "5 equipes cadastradas", tone: "neutral" },
  { label: "Previsão de faturamento", value: "R$ 31,8 mil", detail: "Ticket médio: R$ 193,90", tone: "neutral" },
  { label: "Maior evolução", value: "+4 posições", detail: "Lucas Ferreira", tone: "positive" },
];
