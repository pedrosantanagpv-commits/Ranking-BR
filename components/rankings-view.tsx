"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowDownRight, ArrowUpRight, CalendarDays, FileSpreadsheet, FileText, LoaderCircle, Minus, Search, Trash2, Trophy, UploadCloud, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ClosingComparison } from "@/components/closing-comparison";
import { EvolutionPanel } from "@/components/evolution-panel";
import { ImportAuditPanel } from "@/components/import-audit-panel";
import { deleteRanking, listRankings } from "@/lib/firestore-service";
import { exportRankingExcel, exportRankingPdf } from "@/lib/export-ranking";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Ranking } from "@/lib/types";

function ticketAverage(revenue: number, plates: number, stored?: number) {
  if (typeof stored === "number") return stored;
  return plates > 0 ? revenue / plates : 0;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function MovementIndicator({ movement = 0 }: { movement?: number }) {
  return <span className={`movement ${movement > 0 ? "movement--up" : movement < 0 ? "movement--down" : "movement--same"}`}>
    {movement > 0 ? <ArrowUpRight size={16} /> : movement < 0 ? <ArrowDownRight size={16} /> : <Minus size={16} />}
    {movement === 0 ? "—" : Math.abs(movement)}
  </span>;
}

export function RankingsView() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Ranking | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [executiveSearch, setExecutiveSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [teamSearch, setTeamSearch] = useState("");

  useEffect(() => {
    listRankings()
      .then((items) => { setRankings(items); setSelectedId(items[0]?.id ?? ""); })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Não foi possível carregar os rankings."))
      .finally(() => setLoading(false));
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError("");
    setSuccess("");
    try {
      await deleteRanking(deleteTarget);
      const remaining = rankings.filter((ranking) => ranking.id !== deleteTarget.id);
      setRankings(remaining);
      setSelectedId(remaining[0]?.id ?? "");
      setSuccess(`O ranking “${deleteTarget.label}” foi excluído. Os relatórios desse fechamento podem ser importados novamente.`);
      setDeleteTarget(null);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Não foi possível excluir o ranking.");
    } finally {
      setDeleting(false);
    }
  }

  const selected = rankings.find((ranking) => ranking.id === selectedId) ?? rankings[0];
  const availableTeams = useMemo(() => selected ? [...new Set(selected.entries.map((entry) => entry.team).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")) : [], [selected]);
  const filteredEntries = useMemo(() => selected?.entries.filter((entry) => {
    const matchesSearch = normalize(`${entry.name} ${entry.team} ${(entry.cooperativeCodes ?? []).join(" ")}`).includes(normalize(executiveSearch));
    const matchesTeam = teamFilter === "ALL" || entry.team === teamFilter;
    return matchesSearch && matchesTeam;
  }) ?? [], [executiveSearch, selected, teamFilter]);
  const filteredTeamEntries = useMemo(() => selected?.teamEntries?.filter((entry) => normalize(`${entry.team} ${entry.cooperativeCode}`).includes(normalize(teamSearch))) ?? [], [selected, teamSearch]);
  if (loading) return <div className="panel loading-panel"><LoaderCircle className="spin" /> Carregando histórico...</div>;
  if (error) return <div className="notice notice--error"><AlertCircle size={19} /><span>{error}</span></div>;
  if (!selected) return <section className="panel empty-state"><Trophy size={36} /><h3>Nenhum ranking confirmado</h3><p>Importe os relatórios Gestão Adesão de Leves e Truck para iniciar o histórico.</p><Link className="button button--primary" href="/importar"><UploadCloud size={18} /> Importar relatórios</Link></section>;

  return <div className="rankings-page">
    {actionError && <div className="notice notice--error"><AlertCircle size={19} /><span>{actionError}</span></div>}
    {success && <div className="notice notice--success"><span>{success}</span></div>}
    <section className="ranking-summary-card">
      <div><span className="section-kicker">Histórico de fechamentos</span><h2>{selected.label}</h2><p><CalendarDays size={16} /> {formatDate(selected.periodStart)} a {formatDate(selected.periodEnd)}</p></div>
      <div className="ranking-summary-actions"><label><span>Selecionar fechamento</span><select value={selected.id} onChange={(event) => { setSelectedId(event.target.value); setSuccess(""); setActionError(""); setExecutiveSearch(""); setTeamSearch(""); setTeamFilter("ALL"); }}>{rankings.map((ranking) => <option key={ranking.id} value={ranking.id}>{ranking.label}</option>)}</select></label><div className="ranking-export-actions"><button className="button button--export" type="button" onClick={() => exportRankingExcel(selected)}><FileSpreadsheet size={16} /> Excel</button><button className="button button--export" type="button" onClick={() => exportRankingPdf(selected)}><FileText size={16} /> PDF</button></div>{user && <button className="button button--danger" type="button" onClick={() => setDeleteTarget(selected)}><Trash2 size={17} /> Excluir ranking</button>}</div>
      <div className="ranking-summary-stats"><span><strong>{selected.totalVehicles}</strong> placas produzidas</span><span><strong>{selected.totalExecutives}</strong> executivos</span><span><strong>{formatCurrency(selected.totalRevenue)}</strong> previsão</span></div>
    </section>

    <ClosingComparison rankings={rankings} />

    <EvolutionPanel rankings={rankings} />

    <section className="panel">
      <div className="panel__header"><div><span className="section-kicker">Classificação geral</span><h3>Ranking de executivos</h3></div><Link className="button button--secondary" href="/gerar-arte">Gerar arte do Top 3</Link></div>
      <div className="ranking-filter-bar"><div className="search-field"><Search size={17} /><input value={executiveSearch} onChange={(event) => setExecutiveSearch(event.target.value)} placeholder="Buscar executivo ou cooperativa" /></div><select className="table-select" value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}><option value="ALL">Todas as equipes</option>{availableTeams.map((team) => <option value={team} key={team}>{team}</option>)}</select><span>{filteredEntries.length} de {selected.entries.length}</span></div>
      {filteredEntries.length ? <div className="ranking-table-wrap"><table className="ranking-table"><thead><tr><th>Pos.</th><th>Executivo</th><th>Equipe no fechamento</th><th>Placas</th><th>Prev. Fat.</th><th>T. Médio</th><th>Mov.</th></tr></thead><tbody>{filteredEntries.map((entry) => <tr key={entry.normalizedName}>
        <td><span className={`position-badge position-badge--${entry.position}`}>{entry.position}º</span></td><td><strong>{entry.name}</strong></td><td><span className="team-tag">{entry.team}</span></td><td><strong>{entry.plates}</strong></td><td>{formatCurrency(entry.revenue)}</td><td>{formatCurrency(ticketAverage(entry.revenue, entry.plates, entry.averageTicket))}</td><td><MovementIndicator movement={entry.movement} /></td>
      </tr>)}</tbody></table></div> : <div className="inline-empty inline-empty--compact">Nenhum executivo corresponde aos filtros selecionados.</div>}
    </section>

    <section className="panel">
      <div className="panel__header"><div><span className="section-kicker">Resultado coletivo</span><h3>Ranking de equipes</h3></div></div>
      <div className="ranking-filter-bar ranking-filter-bar--team"><div className="search-field"><Search size={17} /><input value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} placeholder="Buscar equipe ou cooperativa" /></div><span>{filteredTeamEntries.length} de {selected.teamEntries?.length ?? 0}</span></div>
      {filteredTeamEntries.length ? <div className="ranking-table-wrap"><table className="ranking-table"><thead><tr><th>Pos.</th><th>Equipe</th><th>Participantes</th><th>Placas</th><th>Prev. Fat.</th><th>T. Médio</th><th>Mov.</th></tr></thead><tbody>{filteredTeamEntries.map((entry) => <tr key={entry.teamId}>
        <td><span className={`position-badge position-badge--${entry.position}`}>{entry.position}º</span></td><td><strong>{entry.team}</strong></td><td>{entry.members}</td><td><strong>{entry.plates}</strong></td><td>{formatCurrency(entry.revenue)}</td><td>{formatCurrency(ticketAverage(entry.revenue, entry.plates, entry.averageTicket))}</td><td><MovementIndicator movement={entry.movement} /></td>
      </tr>)}</tbody></table></div> : <div className="inline-empty inline-empty--compact">Nenhuma equipe corresponde à busca ou este fechamento ainda não possui equipes.</div>}
    </section>
    <ImportAuditPanel ranking={selected} />
    {deleteTarget && <div className="modal-backdrop"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-ranking-title">
      <div className="modal-card__header"><div><span className="section-kicker">Ação permanente</span><h3 id="delete-ranking-title">Excluir este ranking?</h3></div><button className="icon-button" type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} aria-label="Fechar"><X size={18} /></button></div>
      <div className="delete-ranking-copy"><span><Trash2 size={24} /></span><div><strong>{deleteTarget.label}</strong><p>O fechamento será removido do histórico e essa ação não poderá ser desfeita.</p><small>Executivos, fotos e equipes serão preservados. O par de relatórios poderá ser importado novamente.</small></div></div>
      <div className="modal-actions"><button className="button button--subtle" type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</button><button className="button button--danger" type="button" onClick={confirmDelete} disabled={deleting}>{deleting ? <><LoaderCircle className="spin" size={17} /> Excluindo...</> : <><Trash2 size={17} /> Sim, excluir ranking</>}</button></div>
    </div></div>}
  </div>;
}
