import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Sparkles, Trophy, UploadCloud } from "lucide-react";
import { dashboardMetrics, rankingPreview } from "@/lib/mock-data";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function DashboardContent() {
  return (
    <div className="dashboard-grid">
      <section className="hero-card">
        <div className="hero-card__content">
          <span className="section-kicker"><Sparkles size={14} /> Ranking atualizado</span>
          <h2>Transforme relatórios em desempenho visível.</h2>
          <p>Importe o arquivo, valide os dados e acompanhe quem está avançando no Ranking BR.</p>
          <div className="hero-card__actions">
            <Link href="/importar" className="button button--primary"><UploadCloud size={18} /> Importar relatório</Link>
            <Link href="/rankings" className="button button--ghost">Ver ranking <ArrowRight size={18} /></Link>
          </div>
        </div>
        <div className="hero-card__visual" aria-hidden="true">
          <span className="hero-position">1º</span>
          <Trophy size={108} strokeWidth={1.25} />
          <small>FECHAMENTO BR</small>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Resumo do fechamento">
        {dashboardMetrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small className={metric.tone === "positive" ? "text-positive" : ""}>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="panel ranking-panel">
        <div className="panel__header">
          <div>
            <span className="section-kicker">Prévia do fechamento</span>
            <h3>Ranking de executivos</h3>
          </div>
          <Link href="/rankings" className="text-link">Ranking completo <ArrowRight size={16} /></Link>
        </div>

        <div className="ranking-table-wrap">
          <table className="ranking-table">
            <thead><tr><th>Pos.</th><th>Executivo</th><th>Equipe</th><th>Placas</th><th>Previsão</th><th>Mov.</th></tr></thead>
            <tbody>
              {rankingPreview.map((entry) => (
                <tr key={entry.position}>
                  <td><span className={`position-badge position-badge--${entry.position}`}>{entry.position}º</span></td>
                  <td><div className="person-cell"><span className="person-avatar">{entry.name[0]}</span><strong>{entry.name}</strong></div></td>
                  <td><span className="team-tag">{entry.team}</span></td>
                  <td><strong>{entry.plates}</strong></td>
                  <td>{formatCurrency(entry.revenue)}</td>
                  <td>
                    <span className={`movement ${entry.movement > 0 ? "movement--up" : entry.movement < 0 ? "movement--down" : "movement--same"}`}>
                      {entry.movement > 0 ? <ArrowUpRight size={16} /> : entry.movement < 0 ? <ArrowDownRight size={16} /> : <Minus size={16} />}
                      {entry.movement === 0 ? "—" : Math.abs(entry.movement)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="panel closing-card">
        <div className="panel__header"><div><span className="section-kicker">Último processamento</span><h3>Fechamento atual</h3></div></div>
        <div className="closing-date"><strong>22</strong><span>SET<br />2026</span></div>
        <dl className="closing-list">
          <div><dt>Arquivos</dt><dd>2 relatórios</dd></div>
          <div><dt>Cooperativas</dt><dd>29 identificadas</dd></div>
          <div><dt>Status</dt><dd><span className="status status--success">Processado</span></dd></div>
        </dl>
        <Link href="/gerar-arte" className="button button--secondary button--full">Gerar arte do Top 3 <ArrowRight size={17} /></Link>
      </aside>
    </div>
  );
}
