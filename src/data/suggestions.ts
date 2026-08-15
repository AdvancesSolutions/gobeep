export interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: "programa" | "quiz" | "playlist" | "desafio" | "podcast";
  emoji: string;
  points: number;
  interests: string[]; // matching interest IDs
  duration?: string;
  badge?: string;
}

export const suggestions: Suggestion[] = [
  // Política
  { id: "s1", title: "Debate da Semana", description: "Acompanhe os principais debates políticos ao vivo", type: "programa", emoji: "🏛️", points: 50, interests: ["politica", "noticias"], duration: "1h", badge: "AO VIVO" },
  { id: "s2", title: "Quiz: Constituição", description: "Teste seus conhecimentos sobre a Constituição Brasileira", type: "quiz", emoji: "📜", points: 100, interests: ["politica"], duration: "5min" },

  // Esportes
  { id: "s3", title: "Arena Esportiva", description: "Transmissão dos melhores jogos com narração exclusiva", type: "programa", emoji: "⚽", points: 40, interests: ["esportes"], duration: "2h", badge: "POPULAR" },
  { id: "s4", title: "Quiz: Craques do Futebol", description: "Quem marcou? Adivinhe o jogador pelo gol", type: "quiz", emoji: "🏆", points: 80, interests: ["esportes"], duration: "3min" },
  { id: "s5", title: "Desafio: Palpiteiro", description: "Dê seus palpites e ganhe pontos extras", type: "desafio", emoji: "🎯", points: 120, interests: ["esportes"], duration: "Semanal", badge: "NOVO" },

  // Novelas
  { id: "s6", title: "Resumo da Novela", description: "Não perca nenhum capítulo — resumo diário", type: "programa", emoji: "📺", points: 30, interests: ["novelas"], duration: "15min" },
  { id: "s7", title: "Quiz: Quem Disse?", description: "Adivinhe qual personagem disse a frase famosa", type: "quiz", emoji: "🎭", points: 60, interests: ["novelas", "cinema"], duration: "4min" },

  // Música
  { id: "s8", title: "Top Hits da Semana", description: "As músicas mais tocadas nas rádios do Brasil", type: "playlist", emoji: "🎵", points: 25, interests: ["musica"], duration: "45min", badge: "🔥 HOT" },
  { id: "s9", title: "Quiz: Adivinhe a Música", description: "Ouça 5 segundos e descubra qual é a música", type: "quiz", emoji: "🎧", points: 90, interests: ["musica"], duration: "5min" },
  { id: "s10", title: "Podcast: Bastidores", description: "Histórias por trás das músicas que marcaram época", type: "podcast", emoji: "🎙️", points: 35, interests: ["musica", "cinema"], duration: "30min" },

  // Tecnologia
  { id: "s11", title: "Tech News Flash", description: "As novidades mais quentes do mundo tech", type: "programa", emoji: "💻", points: 40, interests: ["tecnologia"], duration: "20min", badge: "DIÁRIO" },
  { id: "s12", title: "Quiz: Geek Master", description: "Quanto você sabe sobre gadgets e inovação?", type: "quiz", emoji: "🤖", points: 110, interests: ["tecnologia"], duration: "6min" },

  // Humor
  { id: "s13", title: "Stand-Up na Rádio", description: "Os melhores momentos de comédia ao vivo", type: "programa", emoji: "😂", points: 30, interests: ["humor"], duration: "25min" },
  { id: "s14", title: "Desafio: Meme Quiz", description: "Identifique o meme e ganhe pontos", type: "quiz", emoji: "🤣", points: 70, interests: ["humor"], duration: "3min", badge: "VIRAL" },

  // Notícias
  { id: "s15", title: "Plantão BEEP", description: "Alertas de notícias em tempo real personalizados", type: "programa", emoji: "📰", points: 45, interests: ["noticias"], duration: "Contínuo", badge: "24H" },
  { id: "s16", title: "Quiz: Fato ou Fake", description: "Você consegue separar a verdade da mentira?", type: "quiz", emoji: "🔍", points: 85, interests: ["noticias", "politica"], duration: "4min" },

  // Cinema
  { id: "s17", title: "Cine BEEP", description: "Análise e curiosidades sobre filmes em cartaz", type: "programa", emoji: "🎬", points: 35, interests: ["cinema"], duration: "40min" },
  { id: "s18", title: "Quiz: Cinéfilo", description: "Reconheça o filme pela cena descrita", type: "quiz", emoji: "🍿", points: 95, interests: ["cinema"], duration: "5min" },

  // General / fallback
  { id: "s19", title: "Desafio Diário BEEP", description: "Complete tarefas diárias e acumule pontos", type: "desafio", emoji: "⚡", points: 50, interests: [], duration: "5min", badge: "DIÁRIO" },
  { id: "s20", title: "Quiz: Cultura Geral", description: "Teste seus conhecimentos gerais em 10 perguntas", type: "quiz", emoji: "🧠", points: 75, interests: [], duration: "4min" },
];

export function getPersonalizedSuggestions(userInterests: string[], limit = 8): Suggestion[] {
  if (!userInterests.length) {
    // Return general suggestions
    return suggestions.filter(s => s.interests.length === 0 || s.badge).slice(0, limit);
  }

  const scored = suggestions.map(s => {
    const matchCount = s.interests.filter(i => userInterests.includes(i)).length;
    const isGeneral = s.interests.length === 0;
    return { suggestion: s, score: matchCount > 0 ? matchCount * 10 + (s.badge ? 3 : 0) : isGeneral ? 1 : 0 };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.suggestion);
}
