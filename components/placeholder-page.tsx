import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, type LucideIcon } from "lucide-react";

export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  features,
  release,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  release: string;
}) {
  return (
    <section className="placeholder panel">
      <span className="placeholder__icon"><Icon size={34} /></span>
      <span className="section-kicker"><Clock3 size={14} /> Módulo preparado</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="placeholder__features">
        {features.map((feature) => <span key={feature}><CheckCircle2 size={17} /> {feature}</span>)}
      </div>
      <div className="placeholder__footer"><span>Previsto para <strong>{release}</strong></span><Link href="/dashboard" className="text-link">Voltar ao painel <ArrowRight size={16} /></Link></div>
    </section>
  );
}
