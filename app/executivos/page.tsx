import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function ExecutivesPage() {
  return <AppShell><PlaceholderPage icon={BarChart3} title="Cadastro de executivos" description="Mantenha nomes, fotos, equipes e identificadores do relatório em um só lugar." features={["Nome no relatório", "Vínculo com equipe", "Foto para geração das artes"]} release="v0.2.0" /></AppShell>;
}
