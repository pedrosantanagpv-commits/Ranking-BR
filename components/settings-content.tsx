"use client";

import { CheckCircle2, Database, FileSpreadsheet, HardDrive, ShieldCheck } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";

export function SettingsContent() {
  const appsScriptConfigured = Boolean(process.env.NEXT_PUBLIC_APPS_SCRIPT_URL);
  return <div className="settings-page">
    <section className="manager-heading"><div><span className="section-kicker">Administração</span><h2>Configuração do Ranking BR</h2><p>Regras vigentes e situação das integrações desta versão.</p></div></section>
    <section className="settings-grid">
      <article className="panel settings-card"><span><ShieldCheck size={22} /></span><div><h3>Regra do ranking</h3><p>Somente veículos com situação ATIVO. Cada veículo vale 1 ponto. Empates são resolvidos pela maior previsão financeira.</p></div><strong><CheckCircle2 size={16} /> Ativa</strong></article>
      <article className="panel settings-card"><span><Database size={22} /></span><div><h3>Firebase</h3><p>Autenticação, equipes, executivos, importações consolidadas e histórico dos rankings.</p></div><strong className={isFirebaseConfigured ? "ok" : "warning"}>{isFirebaseConfigured ? "Configurado" : "Não configurado"}</strong></article>
      <article className="panel settings-card"><span><FileSpreadsheet size={22} /></span><div><h3>Google Apps Script</h3><p>Integração auxiliar publicada para futuras rotinas e automações do projeto.</p></div><strong className={appsScriptConfigured ? "ok" : "warning"}>{appsScriptConfigured ? "URL configurada" : "URL não informada"}</strong></article>
      <article className="panel settings-card"><span><HardDrive size={22} /></span><div><h3>Armazenamento econômico</h3><p>O Firebase Storage permanece desativado. Fotos são comprimidas e guardadas no cadastro do executivo. Relatórios originais não são armazenados.</p></div><strong><CheckCircle2 size={16} /> Sem Storage</strong></article>
    </section>
  </div>;
}
