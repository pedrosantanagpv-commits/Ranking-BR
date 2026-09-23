"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, FileSpreadsheet, LoaderCircle, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useAuth } from "./auth-provider";
import { getLatestRanking, listExecutives, listTeams, saveClosing } from "@/lib/firestore-service";
import { formatCurrency, formatDate } from "@/lib/format";
import { buildRanking, defaultClosingLabel } from "@/lib/ranking";
import { parseManagementReport } from "@/lib/report-parser";
import type { ParsedReport, RankingEntry, Team } from "@/lib/types";

export function ImportPanel() {
  const { user, configured } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ParsedReport | null>(null);
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [label, setLabel] = useState("");
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedRankingId, setSavedRankingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!configured) return;
    listTeams()
      .then((teamItems) => {
        setTeams(teamItems.filter((team) => team.ativo));
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Não foi possível carregar os cadastros."));
  }, [configured]);

  const totalRevenue = useMemo(() => entries.reduce((sum, entry) => sum + entry.revenue, 0), [entries]);
  const unassignedCount = entries.filter((entry) => !entry.teamId).length;

  const reset = () => {
    setFile(null);
    setReport(null);
    setEntries([]);
    setLabel("");
    setSavedRankingId("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  async function processFile() {
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      const parsed = await parseManagementReport(file);
      const [latest, executiveItems, teamItems] = configured
        ? await Promise.all([getLatestRanking(), listExecutives(), listTeams()])
        : [undefined, [], []];
      const activeExecutives = executiveItems.filter((item) => item.ativo);
      const activeTeams = teamItems.filter((item) => item.ativo);
      setTeams(activeTeams);
      setReport(parsed);
      setEntries(buildRanking(parsed, activeExecutives, activeTeams, latest));
      setLabel(defaultClosingLabel(parsed.periodEnd));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível processar o relatório.");
    } finally {
      setProcessing(false);
    }
  }

  function updateTeam(normalizedName: string, teamId: string) {
    const team = teams.find((item) => item.id === teamId);
    setEntries((current) => current.map((entry) => entry.normalizedName === normalizedName
      ? { ...entry, teamId: team?.id ?? null, team: team?.nome ?? "Sem equipe" }
      : entry));
  }

  async function confirmClosing() {
    if (!report || !user || !label.trim()) return;
    setSaving(true);
    setError("");
    try {
      const rankingId = await saveClosing({ report, label, entries, teams, user });
      setSavedRankingId(rankingId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o fechamento.");
    } finally {
      setSaving(false);
    }
  }

  if (savedRankingId) {
    return (
      <section className="panel success-panel">
        <span className="success-panel__icon"><CheckCircle2 size={38} /></span>
        <span className="section-kicker">Fechamento confirmado</span>
        <h2>{label}</h2>
        <p>O ranking foi salvo com {entries.reduce((sum, item) => sum + item.plates, 0)} veículos ativos e já faz parte do histórico.</p>
        <div className="success-panel__actions">
          <Link className="button button--primary" href="/rankings">Ver ranking</Link>
          <Link className="button button--secondary" href="/gerar-arte">Gerar arte do Top 3</Link>
          <button className="button button--ghost-light" onClick={reset}>Importar outro relatório</button>
        </div>
      </section>
    );
  }

  if (report) {
    return (
      <div className="import-preview-layout">
        <section className="panel import-preview">
          <div className="panel__header">
            <div><span className="section-kicker">Etapa 2 de 3</span><h3>Validar fechamento</h3></div>
            <button className="button button--subtle" onClick={reset}>Trocar arquivo</button>
          </div>

          <div className="preview-metrics">
            <article><span>Veículos ativos</span><strong>{entries.reduce((sum, item) => sum + item.plates, 0)}</strong><small>de {report.totalRows} registros</small></article>
            <article><span>Executivos</span><strong>{entries.length}</strong><small>{unassignedCount} sem equipe</small></article>
            <article><span>Previsão</span><strong>{formatCurrency(totalRevenue)}</strong><small>desempate do ranking</small></article>
            <article><span>Período</span><strong>{formatDate(report.periodStart)}</strong><small>até {formatDate(report.periodEnd)}</small></article>
          </div>

          <label className="form-label">
            <span>Nome do fechamento</span>
            <input className="text-input" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} />
          </label>

          {unassignedCount > 0 && (
            <div className="notice notice--warning"><AlertCircle size={19} /><span>Existem {unassignedCount} participantes sem equipe. Você pode vincular agora nos campos abaixo ou confirmar como “Sem equipe”.</span></div>
          )}

          <div className="ranking-table-wrap preview-table-wrap">
            <table className="ranking-table">
              <thead><tr><th>Pos.</th><th>Executivo</th><th>Equipe neste fechamento</th><th>Ativos</th><th>Previsão</th></tr></thead>
              <tbody>{entries.map((entry) => (
                <tr key={entry.normalizedName}>
                  <td><span className={`position-badge position-badge--${entry.position}`}>{entry.position}º</span></td>
                  <td><strong>{entry.name}</strong>{!entry.executiveId && <small className="new-record">Novo cadastro</small>}</td>
                  <td>
                    <select className="table-select" value={entry.teamId ?? ""} onChange={(event) => updateTeam(entry.normalizedName, event.target.value)}>
                      <option value="">Sem equipe</option>
                      {teams.map((team) => <option value={team.id} key={team.id}>{team.nome}</option>)}
                    </select>
                  </td>
                  <td><strong>{entry.plates}</strong></td>
                  <td>{formatCurrency(entry.revenue)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          {error && <div className="notice notice--error"><AlertCircle size={19} /><span>{error}</span></div>}
          <div className="confirmation-bar">
            <div><ShieldCheck size={20} /><span><strong>Regra aplicada:</strong> somente ATIVO, 1 ponto por veículo e desempate por previsão.</span></div>
            <button className="button button--primary" disabled={saving || !label.trim()} onClick={confirmClosing}>
              {saving ? <><LoaderCircle className="spin" size={18} /> Salvando...</> : "Confirmar e salvar ranking"}
            </button>
          </div>
        </section>

        <aside className="panel report-audit">
          <span className="section-kicker">Auditoria da leitura</span>
          <h3>Gestão Adesão</h3>
          <dl>
            <div><dt>Arquivo</dt><dd>{report.fileName}</dd></div>
            <div><dt>Registros únicos</dt><dd>{report.totalRows}</dd></div>
            <div><dt>Sem placa</dt><dd>{report.missingPlates} <small>identificados pelo chassi</small></dd></div>
            <div><dt>Duplicidades removidas</dt><dd>{report.duplicateRows}</dd></div>
            {Object.entries(report.statusCounts).map(([status, count]) => <div key={status}><dt>{status}</dt><dd>{count}</dd></div>)}
          </dl>
          <p>O arquivo foi lido apenas no navegador. Nomes de associados, placas e chassis não serão gravados no Firebase.</p>
        </aside>
      </div>
    );
  }

  return (
    <div className="two-column-layout">
      <section className="panel import-card">
        <div className="panel__header"><div><span className="section-kicker">Etapa 1 de 3</span><h3>Adicionar relatório</h3></div></div>
        <button
          className="dropzone"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); setFile(event.dataTransfer.files[0] ?? null); }}
        >
          <span className="dropzone__icon"><UploadCloud size={30} /></span>
          <strong>Arraste o Gestão Adesão para cá</strong>
          <span>ou clique para selecionar o arquivo</span>
          <small>Formato exportado pelo sistema: .xls</small>
        </button>
        <input ref={inputRef} className="sr-only" type="file" accept=".xls,application/vnd.ms-excel" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />

        {file ? (
          <div className="selected-file">
            <FileSpreadsheet size={26} />
            <div><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KB · pronto para leitura</span></div>
            <button className="icon-button" aria-label="Remover arquivo" onClick={() => setFile(null)}><X size={18} /></button>
          </div>
        ) : <div className="empty-file-note">Nenhum arquivo selecionado.</div>}

        {error && <div className="notice notice--error"><AlertCircle size={19} /><span>{error}</span></div>}
        <div className="form-actions">
          <button className="button button--ghost" onClick={reset}>Limpar</button>
          <button className="button button--primary" disabled={!file || processing} onClick={processFile}>
            {processing ? <><LoaderCircle className="spin" size={18} /> Lendo relatório...</> : "Processar relatório"}
          </button>
        </div>
        <p className="feature-note">Nada será salvo antes da sua conferência e confirmação.</p>
      </section>

      <aside className="panel guide-card">
        <span className="section-kicker">Como funciona</span>
        <h3>Do relatório ao ranking</h3>
        <ol className="step-list">
          <li><span>1</span><div><strong>Envie o Gestão Adesão</strong><p>Use o arquivo .xls exportado pelo sistema.</p></div></li>
          <li><span>2</span><div><strong>Confira participantes e equipes</strong><p>Novos nomes são identificados automaticamente.</p></div></li>
          <li><span>3</span><div><strong>Confirme o fechamento</strong><p>O ranking e a equipe daquele momento entram no histórico.</p></div></li>
        </ol>
        <div className="security-box"><CheckCircle2 size={20} /><span>Somente os resultados consolidados são salvos. O relatório original não é armazenado.</span></div>
      </aside>
    </div>
  );
}
