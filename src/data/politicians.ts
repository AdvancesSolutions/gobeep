export type CargoType = "presidente" | "governador" | "senador" | "deputado_federal" | "deputado_estadual" | "prefeito" | "vereador";

export const cargoLabels: Record<CargoType, string> = {
  presidente: "Presidente",
  governador: "Governador(a)",
  senador: "Senador(a)",
  deputado_federal: "Deputado(a) Federal",
  deputado_estadual: "Deputado(a) Estadual",
  prefeito: "Prefeito(a)",
  vereador: "Vereador(a)",
};

export const cargoIcons: Record<CargoType, string> = {
  presidente: "🏛️",
  governador: "🏢",
  senador: "⚖️",
  deputado_federal: "🏗️",
  deputado_estadual: "📜",
  prefeito: "🏙️",
  vereador: "🗳️",
};

export interface Candidato {
  id: string;
  nome: string;
  partido: string;
  numero: number;
  foto?: string;
}

export interface PesquisaIntencao {
  id: string;
  titulo: string;
  cargo: CargoType;
  regiao: string;
  dataInicio: string;
  dataFim: string;
  candidatos: Candidato[];
  votos: Record<string, number>; // candidatoId -> votos
  status: "ativa" | "encerrada" | "rascunho";
  criadoEm: string;
}

export interface GabineteProfile {
  id: string;
  nome: string;
  cargo: CargoType;
  partido: string;
  estado: string;
  cidade?: string;
  contato: string;
  foto?: string;
  bannerUrl?: string;
}

export const partidosBrasil = [
  "PL", "PT", "PP", "UNIÃO", "MDB", "PSD", "REPUBLICANOS",
  "PDT", "PSDB", "PSB", "PODE", "PSOL", "AVANTE", "CIDADANIA",
  "PV", "NOVO", "REDE", "PCdoB", "SOLIDARIEDADE", "PROS",
];

export const partidoCores: Record<string, [string, string]> = {
  PL: ["#1E3A8A", "#2563EB"],
  PT: ["#DC2626", "#EF4444"],
  PP: ["#1D4ED8", "#60A5FA"],
  "UNIÃO": ["#1E40AF", "#3B82F6"],
  MDB: ["#15803D", "#22C55E"],
  PSD: ["#F97316", "#FB923C"],
  REPUBLICANOS: ["#1E3A5F", "#3B82F6"],
  PDT: ["#B91C1C", "#F87171"],
  PSDB: ["#1D4ED8", "#93C5FD"],
  PSB: ["#EAB308", "#FDE047"],
  PODE: ["#16A34A", "#4ADE80"],
  PSOL: ["#7C2D12", "#FBBF24"],
  AVANTE: ["#EA580C", "#FB923C"],
  CIDADANIA: ["#7C3AED", "#A78BFA"],
  PV: ["#15803D", "#4ADE80"],
  NOVO: ["#F97316", "#FDBA74"],
  REDE: ["#0D9488", "#2DD4BF"],
  PCdoB: ["#DC2626", "#FCA5A5"],
  SOLIDARIEDADE: ["#EA580C", "#FDBA74"],
  PROS: ["#F59E0B", "#FDE68A"],
};

export const estadosBrasil = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

export interface ApostaOpcao {
  id: string;
  label: string;
  odds: number;
}

export interface ApostaPreditiva {
  id: string;
  titulo: string;
  categoria: string;
  emissora?: string;
  descricao?: string;
  opcoes: ApostaOpcao[];
  dataLimite: string;
  status: "ativa" | "finalizada" | "rascunho";
  criadoEm: string;
  criadoPor: string;
}
