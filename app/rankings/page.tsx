import { Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function RankingsPage() {
  return <AppShell><PlaceholderPage icon={Trophy} title="Rankings e histórico" description="Consulte os fechamentos por período e compare a evolução de executivos e equipes." features={["Ranking de executivos", "Ranking de equipes", "Posição anterior e variação"]} release="v0.2.0" /></AppShell>;
}
