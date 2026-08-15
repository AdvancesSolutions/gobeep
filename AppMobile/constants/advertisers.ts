export interface Advertiser {
  id: string;
  name: string;
  logo: string;
  industry: string;
  contactEmail: string;
  totalBudget: number;
  spentBudget: number;
}

export interface Campaign {
  id: string;
  advertiserId: string;
  name: string;
  programIds: string[];
  status: "ativa" | "pausada" | "encerrada" | "active" | "paused"; // supporting both locales for legacy
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number;
}

export type LeadStatus = "new" | "contacted" | "converted" | "lost";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  campaignName: string;
  date: string;
  status: LeadStatus;
}

export const advertisers: Advertiser[] = [
  { id: "adv1", name: "Coca-Cola Brasil", logo: "🥤", industry: "Bebidas", contactEmail: "midia@cocacola.com.br", totalBudget: 12000000, spentBudget: 7800000 },
  { id: "adv2", name: "Itaú Unibanco", logo: "🏦", industry: "Financeiro", contactEmail: "publicidade@itau.com.br", totalBudget: 9500000, spentBudget: 6200000 },
  { id: "adv3", name: "Ambev", logo: "🍺", industry: "Bebidas", contactEmail: "marketing@ambev.com.br", totalBudget: 15000000, spentBudget: 10500000 },
  { id: "adv4", name: "Magazine Luiza", logo: "🛒", industry: "Varejo", contactEmail: "midia@magalu.com.br", totalBudget: 5000000, spentBudget: 3100000 },
  { id: "adv5", name: "Samsung Brasil", logo: "📱", industry: "Tecnologia", contactEmail: "ads@samsung.com.br", totalBudget: 8000000, spentBudget: 4900000 },
];

export const campaigns: Campaign[] = [
  { id: "c1", advertiserId: "adv1", name: "Verão Coca-Cola 2026", programIds: ["g1", "g5", "s1"], status: "ativa", startDate: "2026-01-10", endDate: "2026-03-31", budget: 4200000, spent: 2800000, impressions: 45000000, clicks: 1350000, reach: 28000000, ctr: 3.0 },
  { id: "c2", advertiserId: "adv1", name: "Copa do Mundo 2026", programIds: ["g1", "g3", "r1"], status: "ativa", startDate: "2026-06-01", endDate: "2026-07-15", budget: 6000000, spent: 1200000, impressions: 12000000, clicks: 480000, reach: 8500000, ctr: 4.0 },
  { id: "c3", advertiserId: "adv2", name: "Itaú Digital", programIds: ["g2", "b2"], status: "ativa", startDate: "2026-02-01", endDate: "2026-05-30", budget: 3500000, spent: 2100000, impressions: 32000000, clicks: 960000, reach: 20000000, ctr: 3.0 },
  { id: "c4", advertiserId: "adv2", name: "Crédito Consignado", programIds: ["g4", "r2"], status: "pausada", startDate: "2026-01-15", endDate: "2026-04-15", budget: 1800000, spent: 900000, impressions: 15000000, clicks: 375000, reach: 10000000, ctr: 2.5 },
  { id: "c5", advertiserId: "adv3", name: "Brahma Duplo Malte", programIds: ["g5", "r3", "s4"], status: "ativa", startDate: "2026-03-01", endDate: "2026-06-30", budget: 5500000, spent: 1800000, impressions: 25000000, clicks: 875000, reach: 18000000, ctr: 3.5 },
  { id: "c6", advertiserId: "adv4", name: "Mega Oferta Magalu", programIds: ["s1", "s2", "b3"], status: "encerrada", startDate: "2025-11-20", endDate: "2025-12-25", budget: 2200000, spent: 2200000, impressions: 38000000, clicks: 1520000, reach: 22000000, ctr: 4.0 },
  { id: "c7", advertiserId: "adv5", name: "Galaxy S26 Launch", programIds: ["g1", "g5", "b2"], status: "ativa", startDate: "2026-03-10", endDate: "2026-04-30", budget: 4000000, spent: 800000, impressions: 8000000, clicks: 320000, reach: 5500000, ctr: 4.0 },
  { id: "c7", advertiserId: "adv5", name: "Galaxy S26 Launch", programIds: ["g1", "g5", "b2"], status: "ativa", startDate: "2026-03-10", endDate: "2026-04-30", budget: 4000000, spent: 800000, impressions: 8000000, clicks: 320000, reach: 5500000, ctr: 4.0 },
];

export const initialLeads: Lead[] = [
  { id: "l1", name: "Carlos Eduardo", email: "carlos.e@gmail.com", phone: "(11) 98765-4321", campaignName: "Verão Coca-Cola 2026", date: "Ontem, 14:20", status: "new" },
  { id: "l2", name: "Ana Beatriz", email: "ana.b@outlook.com", phone: "(11) 91234-5678", campaignName: "Itaú Digital", date: "20/03, 09:15", status: "contacted" },
  { id: "l3", name: "Ricardo Souza", email: "souza.ric@empresa.com", phone: "(11) 95555-0011", campaignName: "Verão Coca-Cola 2026", date: "18/03, 16:45", status: "converted" },
  { id: "l4", name: "Mariana Lima", email: "mari.lima@uol.com.br", phone: "(11) 94444-2233", campaignName: "Verão Coca-Cola 2026", date: "15/03, 11:30", status: "lost" },
];

export const getAdvertiserCampaigns = (advertiserId: string) =>
  campaigns.filter((c) => c.advertiserId === advertiserId);

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);
