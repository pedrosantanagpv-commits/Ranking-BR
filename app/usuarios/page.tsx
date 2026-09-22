import { UserRoundCog } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function UsersPage() {
  return <AppShell><PlaceholderPage icon={UserRoundCog} title="Controle de usuários" description="Gerencie quem pode acessar o Ranking BR e qual é o nível de permissão de cada pessoa." features={["Perfil DEV", "Perfil ADMIN", "Bloqueio de usuário inativo"]} release="v0.2.0" /></AppShell>;
}
