import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { buildTeamRanking } from "./ranking";
import type { AppUser, Executive, ParsedReport, Ranking, RankingEntry, Team } from "./types";

function requireDb() {
  if (!db) throw new Error("O Firebase não está configurado neste ambiente.");
  return db;
}

export async function listTeams() {
  const database = requireDb();
  const snapshot = await getDocs(query(collection(database, "equipes"), orderBy("nome")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Team));
}

export async function saveTeam(team: Pick<Team, "nome" | "ativo"> & { id?: string }) {
  const database = requireDb();
  const reference = team.id ? doc(database, "equipes", team.id) : doc(collection(database, "equipes"));
  await setDoc(reference, {
    nome: team.nome.trim(),
    ativo: team.ativo,
    updatedAt: serverTimestamp(),
    ...(team.id ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true });
  return reference.id;
}

export async function setTeamActive(teamId: string, ativo: boolean) {
  await updateDoc(doc(requireDb(), "equipes", teamId), { ativo, updatedAt: serverTimestamp() });
}

export async function listExecutives() {
  const database = requireDb();
  const snapshot = await getDocs(query(collection(database, "executivos"), orderBy("nome")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Executive));
}

export async function saveExecutive(executive: Omit<Executive, "id"> & { id?: string }) {
  const database = requireDb();
  const reference = executive.id ? doc(database, "executivos", executive.id) : doc(collection(database, "executivos"));
  await setDoc(reference, {
    nome: executive.nome.trim(),
    nomeRelatorio: executive.nomeRelatorio.trim(),
    nomeNormalizado: executive.nomeNormalizado,
    equipeId: executive.equipeId || null,
    fotoDataUrl: executive.fotoDataUrl ?? "",
    ativo: executive.ativo,
    updatedAt: serverTimestamp(),
    ...(executive.id ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true });
  return reference.id;
}

export async function assignTeamMembers(teamId: string, selectedIds: string[], executives: Executive[]) {
  const database = requireDb();
  const selected = new Set(selectedIds);
  const batch = writeBatch(database);
  executives.forEach((executive) => {
    const shouldJoin = selected.has(executive.id);
    const shouldLeave = executive.equipeId === teamId && !shouldJoin;
    if (shouldJoin || shouldLeave) {
      batch.update(doc(database, "executivos", executive.id), {
        equipeId: shouldJoin ? teamId : null,
        updatedAt: serverTimestamp(),
      });
    }
  });
  await batch.commit();
}

export async function listRankings(maxResults = 24) {
  const database = requireDb();
  const snapshot = await getDocs(query(collection(database, "rankings"), orderBy("createdAt", "desc"), limit(maxResults)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Ranking));
}

export async function getLatestRanking() {
  const rankings = await listRankings(1);
  return rankings[0];
}

export async function saveClosing({
  report,
  label,
  entries,
  teams,
  user,
}: {
  report: ParsedReport;
  label: string;
  entries: RankingEntry[];
  teams: Team[];
  user: AppUser;
}) {
  const database = requireDb();
  const importReference = doc(database, "imports", report.fileHash);
  if ((await getDoc(importReference)).exists()) {
    throw new Error("Este mesmo arquivo já foi confirmado anteriormente.");
  }

  const existingExecutives = await listExecutives();
  const executiveByName = new Map(existingExecutives.map((item) => [item.nomeNormalizado, item]));
  const batch = writeBatch(database);
  const selectedTeamByName = new Map(entries.map((entry) => [entry.normalizedName, entry.teamId]));
  const reportNames = new Map(report.rows.map((row) => [row.executivoNormalizado, row.executivo]));
  const executiveReferenceByName = new Map(existingExecutives.map((item) => [item.nomeNormalizado, doc(database, "executivos", item.id)]));

  reportNames.forEach((reportName, normalizedName) => {
    if (!executiveReferenceByName.has(normalizedName)) {
      const executiveReference = doc(collection(database, "executivos"));
      executiveReferenceByName.set(normalizedName, executiveReference);
      batch.set(executiveReference, {
        nome: reportName,
        nomeRelatorio: reportName,
        nomeNormalizado: normalizedName,
        equipeId: selectedTeamByName.get(normalizedName) ?? null,
        fotoDataUrl: "",
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });

  const finalEntries = entries.map((entry) => {
    const existing = executiveByName.get(entry.normalizedName);
    const executiveReference = executiveReferenceByName.get(entry.normalizedName) as ReturnType<typeof doc>;
    if (existing && existing.equipeId !== entry.teamId) {
      batch.update(executiveReference, { equipeId: entry.teamId, updatedAt: serverTimestamp() });
    }

    return { ...entry, executiveId: executiveReference.id };
  });

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const snappedEntries = finalEntries.map((entry) => ({
    ...entry,
    team: entry.teamId ? teamById.get(entry.teamId)?.nome ?? entry.team : "Sem equipe",
  }));
  const teamEntries = buildTeamRanking(snappedEntries);
  const totalRevenue = Number(snappedEntries.reduce((sum, entry) => sum + entry.revenue, 0).toFixed(2));
  const totalVehicles = snappedEntries.reduce((sum, entry) => sum + entry.plates, 0);
  const rankingReference = doc(collection(database, "rankings"));

  batch.set(importReference, {
    fileName: report.fileName,
    fileHash: report.fileHash,
    label: label.trim(),
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    generatedAt: report.generatedAt ?? null,
    generatedBy: report.generatedBy ?? null,
    totalRows: report.totalRows,
    activeRows: totalVehicles,
    duplicateRows: report.duplicateRows,
    missingPlates: report.missingPlates,
    statusCounts: report.statusCounts,
    adhesionCounts: report.adhesionCounts,
    vehicleTypeCounts: report.vehicleTypeCounts,
    rankingId: rankingReference.id,
    rulesVersion: "ativos-1-desempate-previsao-v1",
    createdBy: user.uid,
    createdByName: user.nome,
    createdAt: serverTimestamp(),
  });

  batch.set(rankingReference, {
    label: label.trim(),
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    createdBy: user.uid,
    createdByName: user.nome,
    importId: report.fileHash,
    fileName: report.fileName,
    totalVehicles,
    totalRevenue,
    totalExecutives: snappedEntries.length,
    statusCounts: report.statusCounts,
    entries: snappedEntries,
    teamEntries,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return rankingReference.id;
}
