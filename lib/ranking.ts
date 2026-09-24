import type { Executive, ParsedReport, Ranking, RankingEntry, Team, TeamRankingEntry } from "./types";

export function buildRanking(
  report: ParsedReport,
  executives: Executive[],
  teams: Team[],
  previous?: Ranking,
) {
  const executiveByName = new Map(executives.map((item) => [item.nomeNormalizado, item]));
  const teamByCode = new Map(teams.filter((item) => item.codigoCooperativa).map((item) => [item.codigoCooperativa as string, item]));
  const previousByName = new Map((previous?.entries ?? []).map((item) => [item.normalizedName, item]));
  const grouped = new Map<string, {
    executiveId?: string;
    name: string;
    normalizedName: string;
    plates: number;
    revenue: number;
    newAdhesions: number;
    cooperativeCounts: Map<string, number>;
  }>();

  report.rows
    .filter((row) => row.situacaoNormalizada === "ATIVO")
    .forEach((row) => {
      const current = grouped.get(row.executivoNormalizado);
      const executive = executiveByName.get(row.executivoNormalizado);
      if (current) {
        current.plates += 1;
        current.revenue += row.previsao;
        if (row.cooperativaCodigo) current.cooperativeCounts.set(row.cooperativaCodigo, (current.cooperativeCounts.get(row.cooperativaCodigo) ?? 0) + 1);
        if (row.tipoAdesaoNormalizado === "NOVA ADESAO") current.newAdhesions += 1;
        return;
      }
      grouped.set(row.executivoNormalizado, {
        executiveId: executive?.id,
        name: executive?.nome || row.executivo,
        normalizedName: row.executivoNormalizado,
        plates: 1,
        revenue: row.previsao,
        newAdhesions: row.tipoAdesaoNormalizado === "NOVA ADESAO" ? 1 : 0,
        cooperativeCounts: new Map(row.cooperativaCodigo ? [[row.cooperativaCodigo, 1]] : []),
      });
    });

  const entries: RankingEntry[] = Array.from(grouped.values())
    .sort((a, b) => b.plates - a.plates || b.revenue - a.revenue || a.name.localeCompare(b.name, "pt-BR"))
    .map((entry, index) => ({
      executiveId: entry.executiveId,
      name: entry.name,
      normalizedName: entry.normalizedName,
      plates: entry.plates,
      newAdhesions: entry.newAdhesions,
      cooperativeCodes: Array.from(entry.cooperativeCounts.keys()),
      teamId: entry.cooperativeCounts.size === 1 ? teamByCode.get(Array.from(entry.cooperativeCounts.keys())[0])?.id ?? null : null,
      team: entry.cooperativeCounts.size
        ? Array.from(entry.cooperativeCounts.keys()).map((code) => teamByCode.get(code)?.nome ?? code).join(" / ")
        : "Cooperativa não identificada",
      revenue: Number(entry.revenue.toFixed(2)),
      averageTicket: entry.plates > 0 ? Number((entry.revenue / entry.plates).toFixed(2)) : 0,
      position: index + 1,
      movement: (previousByName.get(entry.normalizedName)?.position ?? index + 1) - (index + 1),
    }));

  return entries;
}

export function buildTeamRanking(report: ParsedReport, teams: Team[], previousEntries: TeamRankingEntry[] = []) {
  const previousByTeam = new Map(previousEntries.map((entry) => [entry.teamId, entry]));
  const teamByCode = new Map(teams.filter((item) => item.codigoCooperativa).map((item) => [item.codigoCooperativa as string, item]));
  const grouped = new Map<string, Omit<TeamRankingEntry, "position" | "movement" | "averageTicket" | "members"> & { memberNames: Set<string> }>();
  report.rows.filter((row) => row.situacaoNormalizada === "ATIVO" && row.cooperativaCodigo).forEach((row) => {
    const team = teamByCode.get(row.cooperativaCodigo);
    if (!team) return;
    const current = grouped.get(team.id);
    if (current) {
      current.plates += 1;
      current.revenue += row.previsao;
      current.memberNames.add(row.executivoNormalizado);
    } else {
      grouped.set(team.id, {
        teamId: team.id,
        cooperativeCode: row.cooperativaCodigo,
        team: team.nome,
        plates: 1,
        revenue: row.previsao,
        memberNames: new Set([row.executivoNormalizado]),
      });
    }
  });
  return Array.from(grouped.values())
    .sort((a, b) => b.plates - a.plates || b.revenue - a.revenue || a.team.localeCompare(b.team, "pt-BR"))
    .map((entry, index) => {
      const { memberNames, ...teamEntry } = entry;
      return {
        ...teamEntry,
        members: memberNames.size,
        revenue: Number(entry.revenue.toFixed(2)),
        averageTicket: entry.plates > 0 ? Number((entry.revenue / entry.plates).toFixed(2)) : 0,
        position: index + 1,
        movement: (previousByTeam.get(entry.teamId)?.position ?? index + 1) - (index + 1),
      };
    });
}

export function defaultClosingLabel(periodEnd: string) {
  const date = new Date(`${periodEnd}T12:00:00`);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
  return `Fechamento ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
}
