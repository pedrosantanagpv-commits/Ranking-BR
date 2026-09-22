"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Brand } from "@/components/brand";

const authMessages: Record<string, string> = {
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "auth/network-request-failed": "Não foi possível conectar. Confira sua internet.",
};

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login, loginDemo, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (caught) {
      const code = (caught as { code?: string }).code ?? "";
      setError(authMessages[code] ?? (caught instanceof Error ? caught.message : "Não foi possível entrar."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleDemo() {
    loginDemo();
    router.replace("/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <Image className="login-showcase__image" src="/assets/login-background.png" alt="Veículo em estrada ao pôr do sol" fill sizes="(max-width: 900px) 0px, 58vw" priority />
        <div className="login-showcase__overlay" />
        <div className="login-showcase__content">
          <span className="showcase-badge">Performance • histórico • evolução</span>
          <h1>Resultados que merecem <em>destaque.</em></h1>
          <p>Transforme relatórios em rankings claros, acompanhe cada movimento e reconheça quem faz a diferença.</p>
          <div className="showcase-stats">
            <div><strong>100%</strong><span>Automatizado</span></div>
            <div><strong>Top 3</strong><span>Pronto para divulgar</span></div>
            <div><strong>Histórico</strong><span>Sem perder evolução</span></div>
          </div>
        </div>
        <span className="login-showcase__footer">GPV ASSOCIADOS • COOPERATIVAS BR</span>
      </section>

      <section className="login-panel">
        <div className="login-panel__inner">
          <Brand />
          <div className="login-copy">
            <span className="eyebrow">Acesso restrito</span>
            <h2>Bem-vindo de volta.</h2>
            <p>Entre com seu usuário para acessar o painel.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              <span>E-mail</span>
              <div className="field"><Mail size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seuemail@empresa.com" required /></div>
            </label>
            <label>
              <span>Senha</span>
              <div className="field"><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" required /><button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="button button--primary button--large button--full" type="submit" disabled={submitting || !configured}>
              {submitting ? "Entrando..." : "Entrar no sistema"} <ArrowRight size={18} />
            </button>
          </form>

          {!configured && (
            <div className="demo-access">
              <p><strong>Firebase ainda não configurado.</strong> Você pode visualizar toda a interface no modo demonstração.</p>
              <button className="button button--secondary button--full" onClick={handleDemo}>Acessar demonstração <ArrowRight size={17} /></button>
            </div>
          )}

          <div className="login-security"><ShieldCheck size={17} /><span>Acesso seguro com Firebase Authentication</span></div>
        </div>
      </section>
    </main>
  );
}
