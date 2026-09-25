"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowDownRight, ArrowUpRight, CalendarDays, LoaderCircle, Minus, Trash2, Trophy, UploadCloud, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { deleteRanking, listRankings } from "@/lib/firestore-service";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Ranking } from "@/lib/types";

function ticketAverage(revenue: number, plates: number, stored?: number) {
  if (typeof stored === "number") return stored;
  return plates > 0 ? revenue / plates : 0;
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
  if (loading) return <div className="panel loading-panel"><LoaderCircle className="spin" /> Carregando histórico...</div>;
  if (error) return <div className="notice notice--error"><AlertCircle size={19} /><span>{error}</span></div>;
  if (!selected) return <section className="panel empty-state"><Trophy size={36} /><h3>Nenhum ranking confirmado</h3><p>Importe os relatórios Gestão Adesão de Leves e Truck para iniciar o histórico.</p><Link className="button button--primary" href="/importar"><UploadCloud size={18} /> Importar relatórios</Link></section>;

  return <div className="rankings-page">
    {actionError && <div className="notice notice--error"><AlertCircle size={19} /><span>{actionError}</span></div>}
    {success && <div className="notice notice--success"><span>{success}</span></div>}
    <section className="ranking-summary-card">
      <div><span className="section-kicker">Histórico de fechamentos</span><h2>{selected.label}</h2><p><CalendarDays size={16} /> {formatDate(selected.periodStart)} a {formatDate(selected.periodEnd)}</p></div>
      <div className="ranking-summary-actions"><label><span>Selecionar fechamento</span><select value={selected.id} onChange={(event) => { setSelectedId(event.target.value); setSuccess(""); setActionError(""); }}>{rankings.map((ranking) => <option key={ranking.id} value={ranking.id}>{ranking.label}</option>)}</select></label>{user && <button className="button button--danger" type="button" onClick={() => setDeleteTarget(selected)}><Trash2 size={17} /> Excluir ranking</button>}</div>
      <div className="ranking-summary-stats"><span><strong>{selected.totalVehicles}</strong> veículos ativos</span><span><strong>{selected.totalExecutives}</strong> executivos</span><span><strong>{formatCurrency(selected.totalRevenue)}</strong> previsão</span></div>
    </section>

    <section className="panel">
      <div className="panel__header"><div><span className="section-kicker">Classificação geral</span><h3>Ranking de executivos</h3></div><Link className="button button--secondary" href="/gerar-arte">Gerar arte do Top 3</Link></div>
      <div className="ranking-table-wrap"><table className="ranking-table"><thead><tr><th>Pos.</th><th>Executivo</th><th>Equipe no fechamento</th><th>Placas</th><th>Prev. Fat.</th><th>T. Médio</th><th>Mov.</th></tr></thead><tbody>{selected.entries.map((entry) => <tr key={entry.normalizedName}>
        <td><span className={`position-badge position-badge--${entry.position}`}>{entry.position}º</span></td><td><strong>{entry.name}</strong></td><td><span className="team-tag">{entry.team}</span></td><td><strong>{entry.plates}</strong></td><td>{formatCurrency(entry.revenue)}</td><td>{formatCurrency(ticketAverage(entry.revenue, entry.plates, entry.averageTicket))}</td><td><MovementIndicator movement={entry.movement} /></td>
      </tr>)}</tbody></table></div>
    </section>

    <section className="panel">
      <div className="panel__header"><div><span className="section-kicker">Resultado coletivo</span><h3>Ranking de equipes</h3></div></div>
      {selected.teamEntries?.length ? <div className="ranking-table-wrap"><table className="ranking-table"><thead><tr><th>Pos.</th><th>Equipe</th><th>Participantes</th><th>Placas</th><th>Prev. Fat.</th><th>T. Médio</th><th>Mov.</th></tr></thead><tbody>{selected.teamEntries.map((entry) => <tr key={entry.teamId}>
        <td><span className={`position-badge position-badge--${entry.position}`}>{entry.position}º</span></td><td><strong>{entry.team}</strong></td><td>{entry.members}</td><td><strong>{entry.plates}</strong></td><td>{formatCurrency(entry.revenue)}</td><td>{formatCurrency(ticketAverage(entry.revenue, entry.plates, entry.averageTicket))}</td><td><MovementIndicator movement={entry.movement} /></td>
      </tr>)}</tbody></table></div> : <div className="inline-empty">Este fechamento não possui participantes vinculados a equipes.</div>}
    </section>
    {deleteTarget && <div className="modal-backdrop"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-ranking-title">
      <div className="modal-card__header"><div><span className="section-kicker">Ação permanente</span><h3 id="delete-ranking-title">Excluir este ranking?</h3></div><button className="icon-button" type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} aria-label="Fechar"><X size={18} /></button></div>
      <div className="delete-ranking-copy"><span><Trash2 size={24} /></span><div><strong>{deleteTarget.label}</strong><p>O fechamento será removido do histórico e essa ação não poderá ser desfeita.</p><small>Executivos, fotos e equipes serão preservados. O par de relatórios poderá ser importado novamente.</small></div></div>
      <div className="modal-actions"><button className="button button--subtle" type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</button><button className="button button--danger" type="button" onClick={confirmDelete} disabled={deleting}>{deleting ? <><LoaderCircle className="spin" size={17} /> Excluindo...</> : <><Trash2 size={17} /> Sim, excluir ranking</>}</button></div>
    </div></div>}
  </div>;
}
