import type { ParsedReport, Team } from "./types";

function normalizeTeamText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
}

export const DEFAULT_TEAM_NAMES: Record<string, string> = {
  "BR.04": "Maná",
  "BR.49": "Alfa",
  "BR.56": "Filhos da Promessa",
  "BR.58": "Elite GPV",
  "BR.60": "Sentinelas",
  "BR.72": "Santa Cruz",
  "BR.74": "Gladiadores",
  "BR.76": "Surubim",
  "BR.78": "Arapiraca",
  "BR.80": "Garanhuns",
  "BR.82": "Revelação",
};

export function extractCooperativeCode(value: string) {
  const match = normalizeTeamText(value).match(/\bBR\s*\.?\s*(\d{1,3})\b/);
  return match ? `BR.${match[1].padStart(2, "0")}` : "";
}

export function teamDocumentId(code: string) {
  return `coop_${code.replace(/[^A-Z0-9]/g, "_")}`;
}

function unconfiguredName(code: string) {
  return `${code} — Equipe não configurada`;
}

export function mergeDefaultTeams(existingTeams: Team[]) {
  const byCode = new Map(existingTeams.filter((team) => team.codigoCooperativa).map((team) => [team.codigoCooperativa as string, team]));
  const byName = new Map(existingTeams.map((team) => [normalizeTeamText(team.nome), team]));
  const defaults = Object.entries(DEFAULT_TEAM_NAMES).map(([code, name]) => {
    const existing = byCode.get(code) ?? byName.get(normalizeTeamText(name));
    return existing
      ? { ...existing, codigoCooperativa: code, configurada: true }
      : { id: teamDocumentId(code), codigoCooperativa: code, nome: name, nomeRelatorio: "", configurada: true, ativo: true };
  });
  const defaultIds = new Set(defaults.map((team) => team.id));
  return [...defaults, ...existingTeams.filter((team) => !defaultIds.has(team.id))];
}

export function resolveReportTeams(report: ParsedReport, existingTeams: Team[]) {
  const baseTeams = mergeDefaultTeams(existingTeams);
  const byCode = new Map(baseTeams.filter((team) => team.codigoCooperativa).map((team) => [team.codigoCooperativa as string, team]));
  const reportCooperatives = new Map<string, string>();

  report.rows.forEach((row) => {
    if (row.cooperativaCodigo && !reportCooperatives.has(row.cooperativaCodigo)) {
      reportCooperatives.set(row.cooperativaCodigo, row.cooperativa);
    }
  });

  reportCooperatives.forEach((rawName, code) => {
    if (byCode.has(code)) {
      const current = byCode.get(code) as Team;
      byCode.set(code, { ...current, nomeRelatorio: rawName });
      return;
    }
    byCode.set(code, {
      id: teamDocumentId(code),
      codigoCooperativa: code,
      nome: unconfiguredName(code),
      nomeRelatorio: rawName,
      configurada: false,
      ativo: true,
    });
  });

  const resolvedIds = new Set(Array.from(byCode.values()).map((team) => team.id));
  return [...Array.from(byCode.values()), ...baseTeams.filter((team) => !resolvedIds.has(team.id))];
}
