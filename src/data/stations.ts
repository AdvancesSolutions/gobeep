import { Radio, Headphones, Antenna, Tv, Monitor, Film } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StationType = "radio" | "tv";

export interface Station {
  id: string;
  name: string;
  freq: string;
  type: StationType;
  icon: LucideIcon;
  location?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  listeners?: string;
  programs?: number;
  since?: string;
}

export interface Session {
  id: number;
  stationId: string;
  station: string;
  freq: string;
  date: string;
  time: string;
  tracks: number;
  duration: string;
  type: StationType;
  timeAgo?: string;
}

export const stations: Station[] = [
  { id: "cidade-fm", name: "Rádio Cidade FM", freq: "98.5 FM", type: "radio", icon: Radio, location: "Av. Paulista, 1000 - São Paulo, SP", phone: "+55 11 3456-7890", website: "radiocidadefm.com.br", rating: 4.9, reviews: 238, listeners: "12.4K", programs: 18, since: "1985" },
  { id: "jovem-pan", name: "Jovem Pan", freq: "100.9 FM", type: "radio", icon: Headphones, location: "R. Augusta, 500 - São Paulo, SP", phone: "+55 11 3333-4444", website: "jovempan.com.br", rating: 4.7, reviews: 412, listeners: "18.2K", programs: 22, since: "1942" },
  { id: "band-fm", name: "Band FM", freq: "96.1 FM", type: "radio", icon: Antenna, location: "R. Radiantes, 13 - São Paulo, SP", phone: "+55 11 2222-3333", website: "bandfm.com.br", rating: 4.5, reviews: 186, listeners: "8.7K", programs: 14, since: "1990" },
  { id: "tv-globo", name: "TV Globo", freq: "Canal 5", type: "tv", icon: Tv, location: "R. Lopes Quintas, 303 - Rio de Janeiro, RJ", phone: "+55 21 2540-2000", website: "globo.com", rating: 4.8, reviews: 1520, listeners: "45.3K", programs: 35, since: "1965" },
  { id: "sbt", name: "SBT", freq: "Canal 4", type: "tv", icon: Monitor, location: "Av. das Comunicações, 4 - Osasco, SP", phone: "+55 11 3685-5000", website: "sbt.com.br", rating: 4.6, reviews: 890, listeners: "32.1K", programs: 28, since: "1981" },
  { id: "record-tv", name: "Record TV", freq: "Canal 7", type: "tv", icon: Film, location: "R. da Várzea, 240 - São Paulo, SP", phone: "+55 11 3300-4000", website: "recordtv.com.br", rating: 4.4, reviews: 654, listeners: "22.8K", programs: 20, since: "1953" },
];

export const sessions: Session[] = [
  { id: 1, stationId: "cidade-fm", station: "Rádio Cidade FM", freq: "98.5 FM", date: "2026-01-17", time: "14:00 - 15:45", tracks: 12, duration: "1h 30m", type: "radio", timeAgo: "30min atrás" },
  { id: 2, stationId: "tv-globo", station: "TV Globo", freq: "Canal 5", date: "2026-01-16", time: "20:00 - 22:00", tracks: 18, duration: "2h", type: "tv", timeAgo: "1h atrás" },
  { id: 3, stationId: "band-fm", station: "Band FM", freq: "96.1 FM", date: "2026-01-15", time: "20:00 - 21:30", tracks: 15, duration: "1h 30m", type: "radio", timeAgo: "1 dia atrás" },
  { id: 4, stationId: "sbt", station: "SBT", freq: "Canal 4", date: "2026-01-14", time: "19:00 - 20:30", tracks: 10, duration: "1h 30m", type: "tv", timeAgo: "2 dias atrás" },
  { id: 5, stationId: "jovem-pan", station: "Jovem Pan", freq: "100.9 FM", date: "2026-01-13", time: "11:00 - 12:00", tracks: 10, duration: "1h", type: "radio", timeAgo: "3 dias atrás" },
  { id: 6, stationId: "record-tv", station: "Record TV", freq: "Canal 7", date: "2026-01-12", time: "21:00 - 22:00", tracks: 8, duration: "1h", type: "tv", timeAgo: "4 dias atrás" },
];

export const getStation = (id: string) => stations.find((s) => s.id === id);
export const getSessionsByStation = (id: string) => sessions.filter((s) => s.stationId === id);
