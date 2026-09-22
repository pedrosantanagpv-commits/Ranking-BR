import { UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function TeamsPage() {
  return <AppShell><PlaceholderPage icon={UsersRound} title="Cadastro de equipes" description="Organize as equipes que participam do Ranking BR e relacione cada executivo à sua estrutura." features={["Criar e editar equipes", "Logo ou imagem da equipe", "Ativar e desativar cadastros"]} release="v0.2.0" /></AppShell>;
}
