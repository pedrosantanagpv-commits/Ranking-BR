"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Edit3, LoaderCircle, Power, UsersRound, X } from "lucide-react";
import { assignTeamMembers, listExecutives, listTeams, saveTeam, setTeamActive } from "@/lib/firestore-service";
import type { Executive, Team } from "@/lib/types";

export function TeamsManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Team | null>(null);
  const [membersTeam, setMembersTeam] = useState<Team | null>(null);
  const [name, setName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [teamItems, executiveItems] = await Promise.all([listTeams(), listExecutives()]);
      setTeams(teamItems);
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
    setEditing(team ?? { id: "", nome: "", ativo: true });
    setName(team?.nome ?? "");
  }

  async function submitTeam(event: FormEvent) {
    event.preventDefault();
    if (!editing || !name.trim()) return;
    setSaving(true);
    try {
      await saveTeam({ id: editing.id || undefined, nome: name, ativo: editing.ativo });
      setEditing(null);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar a equipe.");
    } finally { setSaving(false); }
  }

  function openMembers(team: Team) {
    setMembersTeam(team);
    setSelectedMembers((membersByTeam[team.id] ?? []).map((member) => member.id));
  }

  async function saveMembers() {
    if (!membersTeam) return;
    setSaving(true);
    try {
      await assignTeamMembers(membersTeam.id, selectedMembers, executives);
      setMembersTeam(null);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar os participantes.");
    } finally { setSaving(false); }
  }

  async function toggleTeam(team: Team) {
    setSaving(true);
    try {
      await setTeamActive(team.id, !team.ativo);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível alterar a equipe.");
    } finally { setSaving(false); }
  }

  return (
    <div className="manager-page">
      <section className="manager-heading">
        <div><span className="section-kicker">Estrutura comercial</span><h2>Monte e organize as equipes</h2><p>Crie a equipe e escolha quais participantes fazem parte dela. Cada fechamento preservará essa composição.</p></div>
        <button className="button button--primary" onClick={() => openForm()}><UsersRound size={18} /> Nova equipe</button>
      </section>

      {error && <div className="notice notice--error"><AlertCircle size={19} /><span>{error}</span></div>}
      {loading ? <div className="panel loading-panel"><LoaderCircle className="spin" /> Carregando equipes...</div> : (
        teams.length ? <section className="team-grid">{teams.map((team) => {
          const members = membersByTeam[team.id] ?? [];
          return (
            <article className={`panel team-card ${!team.ativo ? "team-card--inactive" : ""}`} key={team.id}>
              <div className="team-card__top"><span className="team-card__mark"><UsersRound size={22} /></span><span className={`status ${team.ativo ? "status--success" : "status--muted"}`}>{team.ativo ? "Ativa" : "Inativa"}</span></div>
              <h3>{team.nome}</h3>
              <p>{members.length} {members.length === 1 ? "participante" : "participantes"}</p>
              <div className="member-chips">{members.slice(0, 4).map((member) => <span key={member.id}>{member.nome}</span>)}{members.length > 4 && <span>+{members.length - 4}</span>}{!members.length && <small>Nenhum participante vinculado</small>}</div>
              <div className="team-card__actions">
                <button className="button button--subtle" onClick={() => openMembers(team)}>Participantes</button>
                <button className="icon-button" title="Editar" onClick={() => openForm(team)}><Edit3 size={17} /></button>
                <button className="icon-button" title={team.ativo ? "Desativar" : "Ativar"} disabled={saving} onClick={() => toggleTeam(team)}><Power size={17} /></button>
              </div>
            </article>
          );
        })}</section> : <section className="panel empty-state"><UsersRound size={34} /><h3>Nenhuma equipe cadastrada</h3><p>Crie a primeira equipe para começar a organizar os participantes.</p><button className="button button--primary" onClick={() => openForm()}>Criar equipe</button></section>
      )}

      {editing && <div className="modal-backdrop"><form className="modal-card" onSubmit={submitTeam}>
        <div className="modal-card__header"><div><span className="section-kicker">Cadastro</span><h3>{editing.id ? "Editar equipe" : "Nova equipe"}</h3></div><button className="icon-button" type="button" onClick={() => setEditing(null)}><X size={18} /></button></div>
        <label className="form-label"><span>Nome da equipe</span><input className="text-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Sentinelas" autoFocus maxLength={60} required /></label>
        <div className="modal-actions"><button className="button button--subtle" type="button" onClick={() => setEditing(null)}>Cancelar</button><button className="button button--primary" disabled={saving}>{saving ? "Salvando..." : "Salvar equipe"}</button></div>
      </form></div>}

      {membersTeam && <div className="modal-backdrop"><section className="modal-card modal-card--large">
        <div className="modal-card__header"><div><span className="section-kicker">Participantes</span><h3>{membersTeam.nome}</h3></div><button className="icon-button" onClick={() => setMembersTeam(null)}><X size={18} /></button></div>
        {!executives.length ? <div className="notice notice--warning"><AlertCircle size={18} /><span>Os executivos aparecerão aqui após o primeiro relatório confirmado ou cadastro manual.</span></div> : <div className="check-list">{executives.map((executive) => {
          const checked = selectedMembers.includes(executive.id);
          return <label className={`check-row ${checked ? "check-row--checked" : ""}`} key={executive.id}><input type="checkbox" checked={checked} onChange={() => setSelectedMembers((current) => checked ? current.filter((id) => id !== executive.id) : [...current, executive.id])} /><span className="check-box">{checked && <Check size={15} />}</span><span><strong>{executive.nome}</strong><small>{executive.nomeRelatorio}</small></span></label>;
        })}</div>}
        <div className="modal-actions"><button className="button button--subtle" onClick={() => setMembersTeam(null)}>Cancelar</button><button className="button button--primary" disabled={saving} onClick={saveMembers}>{saving ? "Salvando..." : "Salvar participantes"}</button></div>
      </section></div>}
    </div>
  );
}
