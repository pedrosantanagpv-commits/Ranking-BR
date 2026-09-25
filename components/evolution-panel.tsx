"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, Minus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Ranking } from "@/lib/types";

type SubjectType = "executive" | "team";

type HistoryPoint = {
  id: string;
  label: string;
  date: string;
  position: number;
  plates: number;
  revenue: number;
  averageTicket: number;
};

function Delta({ value, suffix = "", currency = false, inverse = false }: { value: number; suffix?: string; currency?: boolean; inverse?: boolean }) {
  const favorable = inverse ? value < 0 : value > 0;
  const unfavorable = inverse ? value > 0 : value < 0;
  const className = favorable ? "evolution-delta--up" : unfavorable ? "evolution-delta--down" : "evolution-delta--same";
  const Icon = favorable ? ArrowUpRight : unfavorable ? ArrowDownRight : Minus;
  const content = currency ? formatCurrency(Math.abs(value)) : `${Math.abs(value)}${suffix}`;
  return <span className={`evolution-delta ${className}`}><Icon size={15} />{value === 0 ? "Sem alteração" : content}</span>;
}

function PositionChart({ points }: { points: HistoryPoint[] }) {
  const width = 760;
  const height = 190;
  const paddingX = 38;
  const paddingY = 28;
  const positions = points.map((point) => point.position);
  const min = Math.min(...positions);
  const max = Math.max(...positions);
  const range = Math.max(1, max - min);
  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? width / 2 : paddingX + index * ((width - paddingX * 2) / (points.length - 1)),
    y: paddingY + ((point.position - min) / range) * (height - paddingY * 2),
    point,
  }));
  const line = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");

  return <div className="evolution-chart-wrap">
    <svg className="evolution-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução de posição nos fechamentos">
      <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} className="evolution-chart__grid" />
      {coordinates.length > 1 && <polyline points={line} className="evolution-chart__line" />}
      {coordinates.map(({ x, y, point }) => <g key={point.id}>
        <circle cx={x} cy={y} r="7" className="evolution-chart__point" />
        <text x={x} y={y - 15} textAnchor="middle" className="evolution-chart__position">{point.position}º</text>
        <text x={x} y={height - 5} textAnchor="middle" className="evolution-chart__label">{point.date.slice(0, 5)}</text>
      </g>)}
    </svg>
  </div>;
}

export function EvolutionPanel({ rankings }: { rankings: Ranking[] }) {
  const [subjectType, setSubjectType] = useState<SubjectType>("executive");
  const [subjectId, setSubjectId] = useState("");
  const latestRanking = rankings[0];
  const options = useMemo(() => subjectType === "executive"
    ? (latestRanking?.entries ?? []).map((entry) => ({ id: entry.normalizedName, name: entry.name }))
    : (latestRanking?.teamEntries ?? []).map((entry) => ({ id: entry.teamId, name: entry.team })), [latestRanking, subjectType]);

  useEffect(() => {
    if (!options.some((option) => option.id === subjectId)) setSubjectId(options[0]?.id ?? "");
  }, [options, subjectId]);

  const points = useMemo<HistoryPoint[]>(() => [...rankings].reverse().flatMap((ranking) => {
    if (subjectType === "executive") {
      const entry = ranking.entries.find((item) => item.normalizedName === subjectId);
      return entry ? [{ id: ranking.id, label: ranking.label, date: formatDate(ranking.periodEnd), position: entry.position, plates: entry.plates, revenue: entry.revenue, averageTicket: entry.averageTicket ?? (entry.plates ? entry.revenue / entry.plates : 0) }] : [];
    }
    const entry = ranking.teamEntries?.find((item) => item.teamId === subjectId);
    return entry ? [{ id: ranking.id, label: ranking.label, date: formatDate(ranking.periodEnd), position: entry.position, plates: entry.plates, revenue: entry.revenue, averageTicket: entry.averageTicket ?? (entry.plates ? entry.revenue / entry.plates : 0) }] : [];
  }), [rankings, subjectId, subjectType]);

  const current = points.at(-1);
  const previous = points.at(-2);
  const hasComparison = Boolean(current && previous);

  return <section className="panel evolution-panel">
    <div className="panel__header evolution-panel__header">
      <div><span className="section-kicker">Comparação entre fechamentos</span><h3>Histórico de evolução</h3><p>Acompanhe posição, placas e indicadores financeiros ao longo do tempo.</p></div>
      <div className="evolution-filters">
        <div className="segmented-control" aria-label="Tipo de acompanhamento">
          <button className={subjectType === "executive" ? "is-active" : ""} onClick={() => setSubjectType("executive")} type="button">Executivo</button>
          <button className={subjectType === "team" ? "is-active" : ""} onClick={() => setSubjectType("team")} type="button">Equipe</button>
        </div>
        <select className="text-input" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} aria-label="Selecionar participante ou equipe">{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
      </div>
    </div>

    {!current ? <div className="inline-empty">Não há dados históricos para esta seleção.</div> : <>
      <div className="evolution-metrics">
        <article><span>Posição atual</span><strong>{current.position}º</strong>{hasComparison ? <Delta value={current.position - previous!.position} inverse suffix=" posições" /> : <small>Primeiro fechamento registrado</small>}</article>
        <article><span>Placas</span><strong>{current.plates}</strong>{hasComparison ? <Delta value={current.plates - previous!.plates} suffix=" placas" /> : <small>Primeiro fechamento registrado</small>}</article>
        <article><span>Previsão</span><strong>{formatCurrency(current.revenue)}</strong>{hasComparison ? <Delta value={current.revenue - previous!.revenue} currency /> : <small>Primeiro fechamento registrado</small>}</article>
        <article><span>Ticket médio</span><strong>{formatCurrency(current.averageTicket)}</strong>{hasComparison ? <Delta value={current.averageTicket - previous!.averageTicket} currency /> : <small>Primeiro fechamento registrado</small>}</article>
      </div>

      <div className="evolution-visual">
        <div className="evolution-visual__heading"><div><BarChart3 size={19} /><strong>Evolução de posição</strong></div><small>Quanto mais alto no gráfico, melhor a colocação.</small></div>
        <PositionChart points={points} />
      </div>

      <div className="ranking-table-wrap"><table className="ranking-table evolution-table"><thead><tr><th>Fechamento</th><th>Data final</th><th>Posição</th><th>Placas</th><th>Prev. Fat.</th><th>T. Médio</th></tr></thead><tbody>{[...points].reverse().map((point) => <tr key={point.id}><td><strong>{point.label}</strong></td><td>{point.date}</td><td><span className={`position-badge position-badge--${point.position}`}>{point.position}º</span></td><td><strong>{point.plates}</strong></td><td>{formatCurrency(point.revenue)}</td><td>{formatCurrency(point.averageTicket)}</td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
