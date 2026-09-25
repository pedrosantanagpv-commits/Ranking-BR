"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRightLeft, ArrowUpRight, BadgeDollarSign, CarFront } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Ranking } from "@/lib/types";

type ComparisonType = "executives" | "teams";
type ComparableEntry = { id: string; name: string; position: number; plates: number; revenue: number };

function comparableEntries(ranking: Ranking, type: ComparisonType): ComparableEntry[] {
  return type === "executives"
    ? ranking.entries.map((entry) => ({ id: entry.normalizedName, name: entry.name, position: entry.position, plates: entry.plates, revenue: entry.revenue }))
    : (ranking.teamEntries ?? []).map((entry) => ({ id: entry.teamId, name: entry.team, position: entry.position, plates: entry.plates, revenue: entry.revenue }));
}

function signed(value: number, currency = false) {
  if (value === 0) return "Sem alteração";
  const formatted = currency ? formatCurrency(Math.abs(value)) : Math.abs(value).toString();
  return `${value > 0 ? "+" : "−"}${formatted}`;
}

export function ClosingComparison({ rankings }: { rankings: Ranking[] }) {
  const [baseId, setBaseId] = useState("");
  const [comparisonId, setComparisonId] = useState("");
  const [type, setType] = useState<ComparisonType>("executives");

  useEffect(() => {
    if (!rankings.length) return;
    if (!rankings.some((ranking) => ranking.id === comparisonId)) setComparisonId(rankings[0].id);
    if (!rankings.some((ranking) => ranking.id === baseId)) setBaseId(rankings[1]?.id ?? rankings[0].id);
  }, [baseId, comparisonId, rankings]);

  const base = rankings.find((ranking) => ranking.id === baseId);
  const comparison = rankings.find((ranking) => ranking.id === comparisonId);
  const changes = useMemo(() => {
    if (!base || !comparison) return [];
    const baseById = new Map(comparableEntries(base, type).map((entry) => [entry.id, entry]));
    return comparableEntries(comparison, type).flatMap((entry) => {
      const previous = baseById.get(entry.id);
      return previous ? [{ ...entry, positionDelta: previous.position - entry.position, platesDelta: entry.plates - previous.plates, revenueDelta: entry.revenue - previous.revenue }] : [];
    });
  }, [base, comparison, type]);

  const highlights = useMemo(() => {
    const climb = [...changes].filter((item) => item.positionDelta > 0).sort((a, b) => b.positionDelta - a.positionDelta)[0];
    const fall = [...changes].filter((item) => item.positionDelta < 0).sort((a, b) => a.positionDelta - b.positionDelta)[0];
    const plates = [...changes].filter((item) => item.platesDelta > 0).sort((a, b) => b.platesDelta - a.platesDelta)[0];
    const revenue = [...changes].filter((item) => item.revenueDelta > 0).sort((a, b) => b.revenueDelta - a.revenueDelta)[0];
    return { climb, fall, plates, revenue };
  }, [changes]);

  if (rankings.length < 2) return <section className="panel comparison-panel"><div className="panel__header"><div><span className="section-kicker">Análise comparativa</span><h3>Comparar fechamentos</h3></div></div><div className="inline-empty">Confirme pelo menos dois fechamentos para liberar a comparação personalizada.</div></section>;
  if (!base || !comparison) return null;

  const vehicleDelta = comparison.totalVehicles - base.totalVehicles;
  const revenueDelta = comparison.totalRevenue - base.totalRevenue;
  const executiveDelta = comparison.totalExecutives - base.totalExecutives;

  return <section className="panel comparison-panel">
    <div className="panel__header comparison-panel__header">
      <div><span className="section-kicker">Análise comparativa</span><h3>Comparar dois fechamentos</h3><p>Escolha livremente a base e o período que deseja analisar.</p></div>
      <div className="comparison-selectors">
        <label><span>Fechamento base</span><select className="text-input" value={base.id} onChange={(event) => setBaseId(event.target.value)}>{rankings.map((ranking) => <option key={ranking.id} value={ranking.id}>{ranking.label}</option>)}</select></label>
        <ArrowRightLeft size={20} />
        <label><span>Comparar com</span><select className="text-input" value={comparison.id} onChange={(event) => setComparisonId(event.target.value)}>{rankings.map((ranking) => <option key={ranking.id} value={ranking.id}>{ranking.label}</option>)}</select></label>
      </div>
    </div>

    <div className="comparison-totals">
      <article><span>Placas produzidas</span><strong>{comparison.totalVehicles}</strong><small className={vehicleDelta >= 0 ? "positive" : "negative"}>{signed(vehicleDelta)} em relação à base</small></article>
      <article><span>Previsão total</span><strong>{formatCurrency(comparison.totalRevenue)}</strong><small className={revenueDelta >= 0 ? "positive" : "negative"}>{signed(revenueDelta, true)} em relação à base</small></article>
      <article><span>Executivos</span><strong>{comparison.totalExecutives}</strong><small className={executiveDelta >= 0 ? "positive" : "negative"}>{signed(executiveDelta)} em relação à base</small></article>
    </div>

    <div className="comparison-highlight-heading"><div><span className="section-kicker">Destaques do período</span><h4>Principais mudanças</h4></div><div className="segmented-control"><button type="button" className={type === "executives" ? "is-active" : ""} onClick={() => setType("executives")}>Executivos</button><button type="button" className={type === "teams" ? "is-active" : ""} onClick={() => setType("teams")}>Equipes</button></div></div>
    <div className="comparison-highlights">
      <article><span className="comparison-highlight-icon positive"><ArrowUpRight size={20} /></span><div><small>Maior subida</small><strong>{highlights.climb?.name ?? "Sem mudança"}</strong><span>{highlights.climb ? `${highlights.climb.positionDelta} posições` : "—"}</span></div></article>
      <article><span className="comparison-highlight-icon negative"><ArrowDownRight size={20} /></span><div><small>Maior queda</small><strong>{highlights.fall?.name ?? "Sem mudança"}</strong><span>{highlights.fall ? `${Math.abs(highlights.fall.positionDelta)} posições` : "—"}</span></div></article>
      <article><span className="comparison-highlight-icon positive"><CarFront size={20} /></span><div><small>Maior crescimento em placas</small><strong>{highlights.plates?.name ?? "Sem crescimento"}</strong><span>{highlights.plates ? `+${highlights.plates.platesDelta} placas` : "—"}</span></div></article>
      <article><span className="comparison-highlight-icon positive"><BadgeDollarSign size={20} /></span><div><small>Maior crescimento financeiro</small><strong>{highlights.revenue?.name ?? "Sem crescimento"}</strong><span>{highlights.revenue ? `+${formatCurrency(highlights.revenue.revenueDelta)}` : "—"}</span></div></article>
    </div>
  </section>;
}
