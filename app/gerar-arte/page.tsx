import { FileImage } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPage } from "@/components/placeholder-page";

export default function ArtworkPage() {
  return <AppShell><PlaceholderPage icon={FileImage} title="Gerador de arte Top 3" description="Transforme o ranking confirmado em uma peça pronta para Story ou Feed." features={["Fotos automáticas do Top 3", "Templates GPV", "Exportação em PNG"]} release="v0.3.0" /></AppShell>;
}
