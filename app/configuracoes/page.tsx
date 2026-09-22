import { Settings } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function SettingsPage() {
  return <AppShell><PlaceholderPage icon={Settings} title="Configurações do sistema" description="Defina regras de ordenação, critérios de desempate e preferências do Ranking BR." features={["Ordenação por placas", "Desempate por previsão", "Identidade visual"]} release="v0.3.0" /></AppShell>;
}
