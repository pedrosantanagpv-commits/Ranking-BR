import type { Executive, ParsedReport, Ranking, RankingEntry, Team, TeamRankingEntry } from "./types";

export function buildRanking(
  report: ParsedReport,
  executives: Executive[],
  teams: Team[],
  previous?: Ranking,
) {
  const executiveByName = new Map(executives.map((item) => [item.nomeNormalizado, item]));
  const teamById = new Map(teams.map((item) => [item.id, item]));
  const previousByName = new Map((previous?.entries ?? []).map((item) => [item.normalizedName, item]));
  const grouped = new Map<string, Omit<RankingEntry, "position" | "movement">>();

  report.rows
    .filter((row) => row.situacaoNormalizada === "ATIVO")
    .forEach((row) => {
      const current = grouped.get(row.executivoNormalizado);
      const executive = executiveByName.get(row.executivoNormalizado);
      const team = executive?.equipeId ? teamById.get(executive.equipeId) : undefined;
      if (current) {
        current.plates += 1;
        current.revenue += row.previsao;
        if (row.tipoAdesaoNormalizado === "NOVA ADESAO") current.newAdhesions += 1;
        return;
      }
      grouped.set(row.executivoNormalizado, {
        executiveId: executive?.id,
        name: executive?.nome || row.executivo,
        normalizedName: row.executivoNormalizado,
        teamId: team?.id ?? null,
        team: team?.nome ?? "Sem equipe",
        plates: 1,
        revenue: row.previsao,
        newAdhesions: row.tipoAdesaoNormalizado === "NOVA ADESAO" ? 1 : 0,
      });
    });

  const entries: RankingEntry[] = Array.from(grouped.values())
    .sort((a, b) => b.plates - a.plates || b.revenue - a.revenue || a.name.localeCompare(b.name, "pt-BR"))
    .map((entry, index) => ({
      ...entry,
      revenue: Number(entry.revenue.toFixed(2)),
      position: index + 1,
      movement: (previousByName.get(entry.normalizedName)?.position ?? index + 1) - (index + 1),
    }));

  return entries;
}

export function buildTeamRanking(entries: RankingEntry[]) {
  const grouped = new Map<string, Omit<TeamRankingEntry, "position">>();
  entries.filter((entry) => entry.teamId).forEach((entry) => {
    const teamId = entry.teamId as string;
    const current = grouped.get(teamId);
    if (current) {
      current.plates += entry.plates;
      current.revenue += entry.revenue;
      current.members += 1;
    } else {
      grouped.set(teamId, { teamId, team: entry.team, plates: entry.plates, revenue: entry.revenue, members: 1 });
    }
  });
  return Array.from(grouped.values())
    .sort((a, b) => b.plates - a.plates || b.revenue - a.revenue || a.team.localeCompare(b.team, "pt-BR"))
    .map((entry, index) => ({ ...entry, revenue: Number(entry.revenue.toFixed(2)), position: index + 1 }));
}

export function defaultClosingLabel(periodEnd: string) {
  const date = new Date(`${periodEnd}T12:00:00`);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
  return `Fechamento ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
}
