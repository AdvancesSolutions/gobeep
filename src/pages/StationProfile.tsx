import { ChevronLeft, MapPin, Phone, Globe, Gift, Headphones, Users, Search, ChevronRight, Star, Clock, Music, Mic, Heart, ExternalLink, Radio, Tv } from "lucide-react";
import radioHero from "@/assets/radio-hero.jpg";
import tvHero from "@/assets/tv-hero.jpg";
import { useState } from "react";
import { getStation, stations } from "@/data/stations";
import beepLogo from "@/assets/beep-logo.png";

const categories = ["Todos", "Música", "Esportes", "Notícias", "Entretenimento"];

const radioPrograms = [
  { name: "Manhã Total", time: "06:00 - 10:00", host: "João Silva", live: true },
  { name: "Rock das Antigas", time: "10:00 - 12:00", host: "Maria Costa", live: false },
  { name: "Notícias em Foco", time: "12:00 - 13:00", host: "Pedro Santos", live: false },
  { name: "Tarde Sertaneja", time: "14:00 - 18:00", host: "Ana Lima", live: false },
  { name: "Esportes ao Vivo", time: "18:00 - 20:00", host: "Carlos M.", live: false },
];

const tvPrograms = [
  { name: "Jornal Nacional", time: "20:00 - 21:00", host: "William Bonner", live: true },
  { name: "Novela das 9", time: "21:00 - 22:00", host: "Elenco", live: false },
  { name: "Fantástico", time: "20:30 - 23:00", host: "Poliana Abritta", live: false },
  { name: "Encontro", time: "10:00 - 12:00", host: "Patrícia Poeta", live: false },
  { name: "Globo Esporte", time: "12:45 - 13:15", host: "Felipe Andreoli", live: false },
];

const StationProfile = ({ onNavigate, stationId }: { onNavigate: (page: string, stationId?: string) => void; stationId: string }) => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [isFavorite, setIsFavorite] = useState(false);

  const station = getStation(stationId) || stations[0];
  const isTV = station.type === "tv";
  const programs = isTV ? tvPrograms : radioPrograms;

  const stats = [
    { label: isTV ? "Audiência" : "Ouvintes", value: station.listeners || "—", icon: Users },
    { label: "Programas", value: String(station.programs || 0), icon: Mic },
    { label: "No ar desde", value: station.since || "—", icon: isTV ? Tv : Radio },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Hero Image */}
      <div className="relative h-64">
        <img src={isTV ? tvHero : radioHero} alt={station.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-background" />
        <div className="absolute top-12 left-4 flex items-center gap-2">
          <button
            onClick={() => onNavigate("home")}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1">
            <img src={beepLogo} alt="BEEP" className="w-5 h-5 object-contain" />
          </div>
        </div>
        <div className="absolute top-12 right-4 flex gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <Heart size={18} className={isFavorite ? "text-primary fill-primary" : "text-white"} />
          </button>
          <button className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <ExternalLink size={18} className="text-white" />
          </button>
        </div>

        {/* Station badge */}
        <div className="absolute -bottom-10 left-5 w-20 h-20 rounded-2xl bg-card-dark border-4 border-background flex flex-col items-center justify-center shadow-lg">
          {isTV ? (
            <>
              <Tv size={24} className="text-primary" />
              <span className="text-[10px] font-bold text-card-dark-foreground mt-1">{station.freq}</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-extrabold text-card-dark-foreground leading-none">
                {station.freq.replace(" FM", "")}
              </span>
              <span className="text-[10px] font-bold text-primary mt-0.5">FM</span>
            </>
          )}
        </div>
      </div>

      {/* Station Info */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{station.name}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={12} className={s <= Math.floor(station.rating || 0) ? "text-primary fill-primary" : "text-primary fill-primary/30"} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-medium">{station.rating} ({station.reviews} avaliações)</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-green-500/15 rounded-full px-2.5 py-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-green-600">AO VIVO</span>
          </div>
        </div>

        {/* Contact info */}
        <div className="mt-4 space-y-2">
          {station.location && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <MapPin size={14} className="text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">{station.location}</span>
            </div>
          )}
          {station.phone && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <Phone size={14} className="text-muted-foreground" />
              </div>
              <span className="text-foreground font-medium">{station.phone}</span>
            </div>
          )}
          {station.website && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <Globe size={14} className="text-muted-foreground" />
              </div>
              <span className="text-primary font-medium">{station.website}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-5">
          {stats.map((stat) => (
            <div key={stat.label} className="flex-1 bg-card rounded-xl p-3 text-center border border-border">
              <stat.icon size={18} className="text-primary mx-auto mb-1.5" />
              <p className="text-base font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {[
            { icon: Gift, label: "Promoções" },
            { icon: Headphones, label: isTV ? "Replay" : "Podcasts" },
            { icon: Music, label: "Playlist" },
          ].map((tag) => (
            <button
              key={tag.label}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground whitespace-nowrap hover:bg-muted transition-colors bg-card"
            >
              <tag.icon size={16} className="text-primary" />
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Programs Section */}
      <div className="px-5 pt-2 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Programação</h2>
          <button className="text-xs text-primary font-semibold">Ver tudo</button>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar programa..."
            className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground bg-card border border-border hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-2 pb-4">
          {programs.map((prog) => (
            <button
              key={prog.name}
              className="flex items-center gap-3 w-full py-3 px-3.5 text-left bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {isTV ? <Tv size={18} className="text-primary" /> : <Mic size={18} className="text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{prog.name}</span>
                  {prog.live && (
                    <span className="text-[10px] font-bold bg-green-500/15 text-green-600 px-1.5 py-0.5 rounded-full">LIVE</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={11} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{prog.time}</span>
                  <span className="text-xs text-muted-foreground">• {prog.host}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
};

export default StationProfile;
