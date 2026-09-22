export type UserRole = "DEV" | "ADMIN";

export type AppUser = {
  uid: string;
  nome: string;
  email: string;
  perfil: UserRole;
  ativo: boolean;
  demo?: boolean;
};

export type RankingEntry = {
  position: number;
  name: string;
  team: string;
  plates: number;
  revenue: number;
  movement: number;
};
