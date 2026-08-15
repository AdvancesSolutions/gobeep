export interface Broadcaster {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string;
}

export interface TvProgram {
  id: string;
  name: string;
  broadcasterId: string;
  genre: string;
  host: string;
  description: string;
  startTime: string; // HH:mm
  endTime: string;
  daysOfWeek: string[];
  currentAudience: number; // percentage points
  avgAudience: number;
  peakAudience: number;
  adSlotsTotal: number;
  adSlotsSold: number;
  adPricePerSlot: number; // BRL
  status: "ao-vivo" | "gravado" | "reprise" | "encerrado";
}

export interface AudienceSnapshot {
  time: string;
  globo: number;
  sbt: number;
  record: number;
  redetv: number;
  band: number;
}

export const broadcasters: Broadcaster[] = [
  { id: "globo", name: "TV Globo", shortName: "Globo", color: "hsl(210 80% 50%)", logo: "🔵" },
  { id: "sbt", name: "SBT", shortName: "SBT", color: "hsl(45 90% 50%)", logo: "🟡" },
  { id: "record", name: "Record TV", shortName: "Record", color: "hsl(120 60% 40%)", logo: "🟢" },
  { id: "redetv", name: "RedeTV!", shortName: "RedeTV!", color: "hsl(280 70% 50%)", logo: "🟣" },
  { id: "band", name: "Band", shortName: "Band", color: "hsl(0 70% 50%)", logo: "🔴" },
];

export const programs: TvProgram[] = [
  // Globo
  { id: "g1", name: "Jornal Nacional", broadcasterId: "globo", genre: "Jornalismo", host: "William Bonner", description: "Principal telejornal do país com cobertura nacional e internacional.", startTime: "20:30", endTime: "21:15", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], currentAudience: 28.5, avgAudience: 27.2, peakAudience: 35.1, adSlotsTotal: 8, adSlotsSold: 8, adPricePerSlot: 850000, status: "ao-vivo" },
  { id: "g2", name: "Fantástico", broadcasterId: "globo", genre: "Variedades", host: "Poliana Abritta", description: "Revista eletrônica dominical com reportagens especiais.", startTime: "20:30", endTime: "23:00", daysOfWeek: ["Dom"], currentAudience: 22.3, avgAudience: 21.8, peakAudience: 29.4, adSlotsTotal: 12, adSlotsSold: 10, adPricePerSlot: 720000, status: "gravado" },
  { id: "g3", name: "Novela das 9", broadcasterId: "globo", genre: "Dramaturgia", host: "Elenco", description: "Principal novela da emissora no horário nobre.", startTime: "21:15", endTime: "22:15", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], currentAudience: 25.1, avgAudience: 24.5, peakAudience: 32.0, adSlotsTotal: 6, adSlotsSold: 6, adPricePerSlot: 900000, status: "ao-vivo" },
  { id: "g4", name: "Bom Dia Brasil", broadcasterId: "globo", genre: "Jornalismo", host: "Ana Paula Araújo", description: "Telejornal matinal com as principais notícias do dia.", startTime: "04:00", endTime: "08:30", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex"], currentAudience: 8.2, avgAudience: 7.8, peakAudience: 12.0, adSlotsTotal: 10, adSlotsSold: 6, adPricePerSlot: 180000, status: "ao-vivo" },
  { id: "g5", name: "Big Brother Brasil", broadcasterId: "globo", genre: "Reality", host: "Tadeu Schmidt", description: "Reality show mais assistido do Brasil.", startTime: "22:15", endTime: "00:30", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"], currentAudience: 19.8, avgAudience: 18.5, peakAudience: 28.0, adSlotsTotal: 10, adSlotsSold: 10, adPricePerSlot: 780000, status: "ao-vivo" },
  { id: "g6", name: "Encontro", broadcasterId: "globo", genre: "Variedades", host: "Patrícia Poeta", description: "Programa matinal de variedades e entretenimento.", startTime: "10:30", endTime: "11:45", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex"], currentAudience: 6.5, avgAudience: 6.2, peakAudience: 9.0, adSlotsTotal: 6, adSlotsSold: 4, adPricePerSlot: 120000, status: "ao-vivo" },

  // SBT
  { id: "s1", name: "Programa Silvio Santos", broadcasterId: "sbt", genre: "Auditório", host: "Patrícia Abravanel", description: "Tradicional programa de auditório dominical.", startTime: "19:00", endTime: "23:30", daysOfWeek: ["Dom"], currentAudience: 12.4, avgAudience: 11.8, peakAudience: 18.2, adSlotsTotal: 14, adSlotsSold: 9, adPricePerSlot: 280000, status: "ao-vivo" },
  { id: "s2", name: "Roda a Roda Jequiti", broadcasterId: "sbt", genre: "Game Show", host: "Patrícia Abravanel", description: "Game show interativo com premiações.", startTime: "18:30", endTime: "19:00", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex"], currentAudience: 7.8, avgAudience: 7.2, peakAudience: 10.5, adSlotsTotal: 4, adSlotsSold: 3, adPricePerSlot: 95000, status: "gravado" },
  { id: "s3", name: "Chaves", broadcasterId: "sbt", genre: "Humor", host: "Roberto Gómez Bolaños", description: "Clássico programa de humor mexicano.", startTime: "12:00", endTime: "13:00", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex"], currentAudience: 5.2, avgAudience: 5.0, peakAudience: 7.8, adSlotsTotal: 4, adSlotsSold: 3, adPricePerSlot: 65000, status: "reprise" },
  { id: "s4", name: "Ratinho", broadcasterId: "sbt", genre: "Auditório", host: "Carlos Massa", description: "Programa de auditório com variedades e humor.", startTime: "21:45", endTime: "23:00", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex"], currentAudience: 6.1, avgAudience: 5.8, peakAudience: 9.2, adSlotsTotal: 6, adSlotsSold: 4, adPricePerSlot: 110000, status: "ao-vivo" },

  // Record
  { id: "r1", name: "Jornal da Record", broadcasterId: "record", genre: "Jornalismo", host: "Luiz Datena", description: "Principal telejornal da Record TV.", startTime: "19:50", endTime: "20:45", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], currentAudience: 9.8, avgAudience: 9.2, peakAudience: 13.5, adSlotsTotal: 6, adSlotsSold: 5, adPricePerSlot: 180000, status: "ao-vivo" },
  { id: "r2", name: "Cidade Alerta", broadcasterId: "record", genre: "Jornalismo", host: "Luiz Bacci", description: "Programa jornalístico policial.", startTime: "16:45", endTime: "19:50", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex"], currentAudience: 7.5, avgAudience: 7.0, peakAudience: 11.0, adSlotsTotal: 8, adSlotsSold: 5, adPricePerSlot: 95000, status: "ao-vivo" },
  { id: "r3", name: "A Fazenda", broadcasterId: "record", genre: "Reality", host: "Adriane Galisteu", description: "Reality show rural com celebridades.", startTime: "22:45", endTime: "00:00", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"], currentAudience: 8.2, avgAudience: 7.8, peakAudience: 12.5, adSlotsTotal: 8, adSlotsSold: 6, adPricePerSlot: 150000, status: "ao-vivo" },

  // RedeTV
  { id: "rt1", name: "Superpop", broadcasterId: "redetv", genre: "Auditório", host: "Luciana Gimenez", description: "Talk show noturno de entretenimento.", startTime: "22:30", endTime: "00:00", daysOfWeek: ["Seg"], currentAudience: 2.8, avgAudience: 2.5, peakAudience: 4.2, adSlotsTotal: 6, adSlotsSold: 2, adPricePerSlot: 35000, status: "ao-vivo" },
  { id: "rt2", name: "TV Fama", broadcasterId: "redetv", genre: "Fofoca", host: "Alinne Prado", description: "Programa de fofocas e celebridades.", startTime: "19:00", endTime: "20:00", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex"], currentAudience: 2.1, avgAudience: 1.9, peakAudience: 3.5, adSlotsTotal: 4, adSlotsSold: 1, adPricePerSlot: 22000, status: "gravado" },

  // Band
  { id: "b1", name: "Jornal da Band", broadcasterId: "band", genre: "Jornalismo", host: "Eduardo Oinegue", description: "Telejornal noturno da Band.", startTime: "19:20", endTime: "20:00", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex"], currentAudience: 3.5, avgAudience: 3.2, peakAudience: 5.8, adSlotsTotal: 4, adSlotsSold: 2, adPricePerSlot: 55000, status: "ao-vivo" },
  { id: "b2", name: "MasterChef Brasil", broadcasterId: "band", genre: "Culinária", host: "Ana Paula Padrão", description: "Competição culinária com chefs amadores e profissionais.", startTime: "22:30", endTime: "00:00", daysOfWeek: ["Ter"], currentAudience: 5.8, avgAudience: 5.5, peakAudience: 8.9, adSlotsTotal: 8, adSlotsSold: 6, adPricePerSlot: 120000, status: "gravado" },
  { id: "b3", name: "Brasil Urgente", broadcasterId: "band", genre: "Jornalismo", host: "José Luiz Datena", description: "Programa jornalístico vespertino.", startTime: "16:00", endTime: "19:20", daysOfWeek: ["Seg", "Ter", "Qua", "Qui", "Sex"], currentAudience: 4.2, avgAudience: 4.0, peakAudience: 7.0, adSlotsTotal: 10, adSlotsSold: 5, adPricePerSlot: 65000, status: "ao-vivo" },
];

// Simulated real-time audience data (last 24h in 30-min intervals)
export const generateAudienceTimeline = (): AudienceSnapshot[] => {
  const timeline: AudienceSnapshot[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const hourFactor = h >= 6 && h <= 8 ? 0.4 : h >= 12 && h <= 14 ? 0.5 : h >= 18 && h <= 23 ? 1 : 0.15;
      const primeBoost = h >= 20 && h <= 22 ? 1.5 : 1;
      timeline.push({
        time,
        globo: +(((15 + Math.random() * 18) * hourFactor * primeBoost).toFixed(1)),
        sbt: +(((5 + Math.random() * 9) * hourFactor * (h === 19 ? 1.3 : 1)).toFixed(1)),
        record: +(((4 + Math.random() * 8) * hourFactor).toFixed(1)),
        redetv: +(((1 + Math.random() * 3) * hourFactor).toFixed(1)),
        band: +(((2 + Math.random() * 5) * hourFactor).toFixed(1)),
      });
    }
  }
  return timeline;
};

export const getBroadcasterPrograms = (broadcasterId: string) =>
  programs.filter((p) => p.broadcasterId === broadcasterId);

export const getCompetitorPrograms = (broadcasterId: string) =>
  programs.filter((p) => p.broadcasterId !== broadcasterId);

export const getAudienceRanking = () => {
  const totals: Record<string, number> = {};
  for (const b of broadcasters) {
    const progs = getBroadcasterPrograms(b.id);
    totals[b.id] = progs.reduce((sum, p) => sum + p.currentAudience, 0) / (progs.length || 1);
  }
  return broadcasters
    .map((b) => ({ ...b, avgAudience: +(totals[b.id].toFixed(1)) }))
    .sort((a, b) => b.avgAudience - a.avgAudience);
};
