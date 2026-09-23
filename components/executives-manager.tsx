"use client";
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, Camera, Edit3, LoaderCircle, Plus, Search, UserRound, X } from "lucide-react";
import { listExecutives, listTeams, saveExecutive } from "@/lib/firestore-service";
import { getInitials } from "@/lib/format";
import { compressProfileImage } from "@/lib/image-utils";
import { normalizeText } from "@/lib/report-parser";
import type { Executive, Team } from "@/lib/types";

const emptyExecutive: Omit<Executive, "id"> = { nome: "", nomeRelatorio: "", nomeNormalizado: "", equipeId: null, fotoDataUrl: "", ativo: true };

export function ExecutivesManager() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<(Omit<Executive, "id"> & { id?: string }) | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [executiveItems, teamItems] = await Promise.all([listExecutives(), listTeams()]);
      setExecutives(executiveItems);
      setTeams(teamItems.filter((team) => team.ativo));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar os executivos."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  const teamById = useMemo(() => new Map(teams.map((team) => [team.id, team.nome])), [teams]);
  const filtered = executives.filter((executive) => normalizeText(`${executive.nome} ${executive.nomeRelatorio} ${teamById.get(executive.equipeId ?? "") ?? ""}`).includes(normalizeText(search)));

  function openForm(executive?: Executive) {
    setEditing(executive ? { ...executive } : { ...emptyExecutive });
    setError("");
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editing) return;
    setPhotoLoading(true);
    try { setEditing({ ...editing, fotoDataUrl: await compressProfileImage(file) }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível processar a foto."); }
    finally { setPhotoLoading(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const reportName = editing.nomeRelatorio.trim() || editing.nome.trim();
      await saveExecutive({
        ...editing,
        nome: editing.nome.trim(),
        nomeRelatorio: reportName,
        nomeNormalizado: normalizeText(reportName),
      });
      setEditing(null);
      await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível salvar o executivo."); }
    finally { setSaving(false); }
  }

  return <div className="manager-page">
    <section className="manager-heading">
      <div><span className="section-kicker">Participantes</span><h2>Executivos do ranking</h2><p>O nome do relatório faz o vínculo automático. A foto será usada na arte do Top 3.</p></div>
      <button className="button button--primary" onClick={() => openForm()}><Plus size={18} /> Novo executivo</button>
    </section>

    <div className="manager-toolbar"><div className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou equipe" /></div><span>{filtered.length} participantes</span></div>
    {error && <div className="notice notice--error"><AlertCircle size={19} /><span>{error}</span></div>}
    {loading ? <div className="panel loading-panel"><LoaderCircle className="spin" /> Carregando executivos...</div> : filtered.length ? <section className="panel data-panel"><div className="ranking-table-wrap"><table className="ranking-table executive-table"><thead><tr><th>Participante</th><th>Nome identificado no relatório</th><th>Equipe atual</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map((executive) => <tr key={executive.id}>
      <td><div className="person-cell">{executive.fotoDataUrl ? <img className="person-photo" src={executive.fotoDataUrl} alt="" /> : <span className="person-avatar">{getInitials(executive.nome)}</span>}<strong>{executive.nome}</strong></div></td>
      <td>{executive.nomeRelatorio}</td><td><span className="team-tag">{teamById.get(executive.equipeId ?? "") ?? "Sem equipe"}</span></td><td><span className={`status ${executive.ativo ? "status--success" : "status--muted"}`}>{executive.ativo ? "Ativo" : "Inativo"}</span></td><td><button className="icon-button" onClick={() => openForm(executive)} title="Editar"><Edit3 size={16} /></button></td>
    </tr>)}</tbody></table></div></section> : <section className="panel empty-state"><UserRound size={34} /><h3>Nenhum executivo encontrado</h3><p>Eles serão cadastrados automaticamente quando você confirmar o primeiro relatório.</p></section>}

    {editing && <div className="modal-backdrop"><form className="modal-card modal-card--large" onSubmit={submit}>
      <div className="modal-card__header"><div><span className="section-kicker">Cadastro</span><h3>{editing.id ? "Editar executivo" : "Novo executivo"}</h3></div><button type="button" className="icon-button" onClick={() => setEditing(null)}><X size={18} /></button></div>
      <div className="profile-editor"><div className="profile-preview">{editing.fotoDataUrl ? <img src={editing.fotoDataUrl} alt="Prévia" /> : <span>{getInitials(editing.nome || "Novo")}</span>}</div><label className="button button--subtle file-button"><Camera size={17} /> {photoLoading ? "Processando..." : "Escolher foto"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} disabled={photoLoading} /></label><small>A foto será comprimida e salva no Firestore, sem ativar o Storage.</small></div>
      <div className="form-grid"><label className="form-label"><span>Nome de exibição</span><input className="text-input" value={editing.nome} onChange={(event) => setEditing({ ...editing, nome: event.target.value })} required /></label><label className="form-label"><span>Nome exatamente como aparece no relatório</span><input className="text-input" value={editing.nomeRelatorio} onChange={(event) => setEditing({ ...editing, nomeRelatorio: event.target.value })} placeholder="Se vazio, usaremos o nome de exibição" /></label><label className="form-label"><span>Equipe atual</span><select className="text-input" value={editing.equipeId ?? ""} onChange={(event) => setEditing({ ...editing, equipeId: event.target.value || null })}><option value="">Sem equipe</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.nome}</option>)}</select></label><label className="toggle-label"><input type="checkbox" checked={editing.ativo} onChange={(event) => setEditing({ ...editing, ativo: event.target.checked })} /><span>Participante ativo</span></label></div>
      <div className="modal-actions"><button className="button button--subtle" type="button" onClick={() => setEditing(null)}>Cancelar</button><button className="button button--primary" disabled={saving || photoLoading}>{saving ? "Salvando..." : "Salvar executivo"}</button></div>
    </form></div>}
  </div>;
}
