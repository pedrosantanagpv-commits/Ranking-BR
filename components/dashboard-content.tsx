"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, LoaderCircle, Minus, Sparkles, Trophy, UploadCloud } from "lucide-react";
import { getLatestRanking, listExecutives, listTeams } from "@/lib/firestore-service";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Ranking } from "@/lib/types";

export function DashboardContent() {
  const [ranking, setRanking] = useState<Ranking | undefined>();
  const [executiveCount, setExecutiveCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLatestRanking(), listExecutives(), listTeams()])
      .then(([latest, executives, teams]) => {
        setRanking(latest);
        setExecutiveCount(executives.filter((item) => item.ativo).length);
        setTeamCount(teams.filter((item) => item.ativo).length);
      }).catch(() => {
        setRanking(undefined);
        setExecutiveCount(0);
        setTeamCount(0);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="panel loading-panel"><LoaderCircle className="spin" /> Carregando painel...</div>;

  const greatestMovement = ranking?.entries.reduce((best, entry) => entry.movement > best.movement ? entry : best, ranking.entries[0]) ?? null;
  const metrics = [
    { label: "Placas no fechamento", value: ranking ? String(ranking.totalVehicles) : "—", detail: ranking?.label ?? "Nenhum fechamento" },
    { label: "Executivos ativos", value: String(executiveCount), detail: `${teamCount} equipes cadastradas` },
    { label: "Previsão de faturamento", value: ranking ? formatCurrency(ranking.totalRevenue) : "—", detail: ranking ? `Ticket médio: ${formatCurrency(ranking.totalRevenue / Math.max(ranking.totalVehicles, 1))}` : "Aguardando relatório" },
    { label: "Maior evolução", value: greatestMovement && greatestMovement.movement > 0 ? `+${greatestMovement.movement} posições` : "—", detail: greatestMovement?.movement ? greatestMovement.name : "Sem comparação anterior" },
  ];

  return (
    <div className="dashboard-grid">
      <section className="hero-card">
        <div className="hero-card__content">
          <span className="section-kicker"><Sparkles size={14} /> {ranking ? "Ranking atualizado" : "Pronto para começar"}</span>
          <h2>{ranking ? "Resultados reais, histórico preservado." : "Transforme relatórios em desempenho visível."}</h2>
          <p>{ranking ? `${ranking.label} já está consolidado. Consulte a classificação ou gere a arte do Top 3.` : "Importe o Gestão Adesão, valide os participantes e confirme o primeiro fechamento."}</p>
          <div className="hero-card__actions"><Link href="/importar" className="button button--primary"><UploadCloud size={18} /> Importar relatório</Link><Link href="/rankings" className="button button--ghost">Ver ranking <ArrowRight size={18} /></Link></div>
        </div>
        <div className="hero-card__visual" aria-hidden="true"><span className="hero-position">1º</span><Trophy size={108} strokeWidth={1.25} /><small>FECHAMENTO BR</small></div>
      </section>

      <section className="metrics-grid" aria-label="Resumo do fechamento">{metrics.map((metric) => <article className="metric-card" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>)}</section>

      <section className="panel ranking-panel">
        <div className="panel__header"><div><span className="section-kicker">{ranking ? "Último fechamento" : "Aguardando importação"}</span><h3>Ranking de executivos</h3></div><Link href="/rankings" className="text-link">Ranking completo <ArrowRight size={16} /></Link></div>
        {ranking ? <div className="ranking-table-wrap"><table className="ranking-table"><thead><tr><th>Pos.</th><th>Executivo</th><th>Equipe</th><th>Placas</th><th>Previsão</th><th>Mov.</th></tr></thead><tbody>{ranking.entries.slice(0, 5).map((entry) => <tr key={entry.normalizedName}><td><span className={`position-badge position-badge--${entry.position}`}>{entry.position}º</span></td><td><strong>{entry.name}</strong></td><td><span className="team-tag">{entry.team}</span></td><td><strong>{entry.plates}</strong></td><td>{formatCurrency(entry.revenue)}</td><td><span className={`movement ${entry.movement > 0 ? "movement--up" : entry.movement < 0 ? "movement--down" : "movement--same"}`}>{entry.movement > 0 ? <ArrowUpRight size={16} /> : entry.movement < 0 ? <ArrowDownRight size={16} /> : <Minus size={16} />}{entry.movement === 0 ? "—" : Math.abs(entry.movement)}</span></td></tr>)}</tbody></table></div> : <div className="inline-empty">Nenhum ranking confirmado. Importe o primeiro relatório para substituir os dados demonstrativos.</div>}
      </section>

      <aside className="panel closing-card">
        <div className="panel__header"><div><span className="section-kicker">Último processamento</span><h3>Fechamento atual</h3></div></div>
        {ranking ? <><div className="closing-date"><strong>{new Date(`${ranking.periodEnd}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(`${ranking.periodEnd}T12:00:00`)).replace(".", "").toUpperCase()}<br />{new Date(`${ranking.periodEnd}T12:00:00`).getFullYear()}</span></div><dl className="closing-list"><div><dt>Período</dt><dd>{formatDate(ranking.periodStart)} a {formatDate(ranking.periodEnd)}</dd></div><div><dt>Executivos</dt><dd>{ranking.totalExecutives}</dd></div><div><dt>Status</dt><dd><span className="status status--success">Confirmado</span></dd></div></dl><Link href="/gerar-arte" className="button button--secondary button--full">Gerar arte do Top 3 <ArrowRight size={17} /></Link></> : <><div className="closing-placeholder"><UploadCloud size={34} /><span>Faça a primeira importação</span></div><Link href="/importar" className="button button--secondary button--full">Importar agora <ArrowRight size={17} /></Link></>}
      </aside>
    </div>
  );
}
