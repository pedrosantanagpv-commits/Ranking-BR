"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, Edit3, LoaderCircle, Power, UsersRound, X } from "lucide-react";
import { listExecutives, listTeams, saveTeam } from "@/lib/firestore-service";
import { extractCooperativeCode, mergeDefaultTeams } from "@/lib/team-mapping";
import type { Executive, Team } from "@/lib/types";

export function TeamsManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Team | null>(null);
  const [name, setName] = useState("");
  const [cooperativeCode, setCooperativeCode] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [teamItems, executiveItems] = await Promise.all([listTeams(), listExecutives()]);
      setTeams(mergeDefaultTeams(teamItems));
      setExecutives(executiveItems.filter((item) => item.ativo));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar as equipes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const membersByTeam = useMemo(() => executives.reduce<Record<string, Executive[]>>((result, executive) => {
    if (executive.equipeId) (result[executive.equipeId] ??= []).push(executive);
    return result;
  }, {}), [executives]);

  function openForm(team?: Team) {
    setEditing(team ?? { id: "", nome: "", codigoCooperativa: "", configurada: true, ativo: true });
    setName(team?.nome ?? "");
    setCooperativeCode(team?.codigoCooperativa ?? "");
  }

  async function submitTeam(event: FormEvent) {
    event.preventDefault();
    const normalizedCode = extractCooperativeCode(cooperativeCode);
    if (!editing || !name.trim() || !normalizedCode) return;
    setSaving(true);
    try {
      await saveTeam({
        id: editing.id || undefined,
        nome: name,
        codigoCooperativa: normalizedCode,
        nomeRelatorio: editing.nomeRelatorio,
        configurada: true,
        ativo: editing.ativo,
      });
      setEditing(null);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar a equipe.");
    } finally { setSaving(false); }
  }

  async function toggleTeam(team: Team) {
    setSaving(true);
    try {
      await saveTeam({
        id: team.id,
        nome: team.nome,
        codigoCooperativa: team.codigoCooperativa,
        nomeRelatorio: team.nomeRelatorio,
        configurada: team.configurada,
        ativo: !team.ativo,
      });
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível alterar a equipe.");
    } finally { setSaving(false); }
  }

  return (
    <div className="manager-page">
      <section className="manager-heading">
        <div><span className="section-kicker">Estrutura comercial</span><h2>Equipes por cooperativa</h2><p>Cada código BR define automaticamente a equipe dos executivos e o agrupamento do ranking.</p></div>
        <button className="button button--primary" onClick={() => openForm()}><UsersRound size={18} /> Nova configuração</button>
      </section>

      {error && <div className="notice notice--error"><AlertCircle size={19} /><span>{error}</span></div>}
      {loading ? <div className="panel loading-panel"><LoaderCircle className="spin" /> Carregando equipes...</div> : (
        teams.length ? <section className="team-grid">{teams.map((team) => {
          const members = membersByTeam[team.id] ?? [];
          return (
            <article className={`panel team-card ${!team.ativo ? "team-card--inactive" : ""}`} key={team.id}>
              <div className="team-card__top"><span className="team-card__mark"><UsersRound size={22} /></span><span className={`status ${team.ativo ? "status--success" : "status--muted"}`}>{team.ativo ? "Ativa" : "Inativa"}</span></div>
              <span className="section-kicker">{team.codigoCooperativa || "Código não definido"}</span>
              <h3>{team.nome}</h3>
              <p>{members.length} {members.length === 1 ? "participante" : "participantes"}</p>
              <div className="member-chips">{members.slice(0, 4).map((member) => <span key={member.id}>{member.nome}</span>)}{members.length > 4 && <span>+{members.length - 4}</span>}{!members.length && <small>Nenhum participante vinculado</small>}</div>
              <div className="team-card__actions">
                <button className="icon-button" title="Editar" onClick={() => openForm(team)}><Edit3 size={17} /></button>
                <button className="icon-button" title={team.ativo ? "Desativar" : "Ativar"} disabled={saving} onClick={() => toggleTeam(team)}><Power size={17} /></button>
              </div>
            </article>
          );
        })}</section> : <section className="panel empty-state"><UsersRound size={34} /><h3>Nenhuma equipe cadastrada</h3><p>Crie a primeira equipe para começar a organizar os participantes.</p><button className="button button--primary" onClick={() => openForm()}>Criar equipe</button></section>
      )}

      {editing && <div className="modal-backdrop"><form className="modal-card" onSubmit={submitTeam}>
        <div className="modal-card__header"><div><span className="section-kicker">Cadastro</span><h3>{editing.id ? "Editar equipe" : "Nova equipe"}</h3></div><button className="icon-button" type="button" onClick={() => setEditing(null)}><X size={18} /></button></div>
        <div className="form-grid">
          <label className="form-label"><span>Código da cooperativa</span><input className="text-input" value={cooperativeCode} onChange={(event) => setCooperativeCode(event.target.value)} placeholder="Ex.: BR.60" autoFocus maxLength={12} readOnly={Boolean(editing.id)} required /></label>
          <label className="form-label"><span>Nome da equipe</span><input className="text-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Sentinelas" maxLength={60} required /></label>
        </div>
        {editing.nomeRelatorio && <div className="notice"><span><strong>No relatório:</strong> {editing.nomeRelatorio}</span></div>}
        <div className="modal-actions"><button className="button button--subtle" type="button" onClick={() => setEditing(null)}>Cancelar</button><button className="button button--primary" disabled={saving}>{saving ? "Salvando..." : "Salvar equipe"}</button></div>
      </form></div>}
    </div>
  );
}
