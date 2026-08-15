import { programs, type TvProgram } from "./broadcasters";

export interface PollOption {
  id: string;
  label: string;
  votes: number;
  percentage: number;
}

export interface Poll {
  id: string;
  question: string;
  programId: string;
  options: PollOption[];
  totalVotes: number;
  status: "active" | "closed";
  createdAt: string;
}

export interface Comment {
  id: string;
  userName: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface PresenterProfile {
  name: string;
  bio: string;
  photo: string;
  followers: number;
  yearsOnAir: number;
  programIds: string[];
}

// Mock polls
export const mockPolls: Poll[] = [
  {
    id: "p1", question: "Qual matéria você quer ver amanhã?", programId: "g1",
    options: [
      { id: "o1", label: "Economia", votes: 4520, percentage: 38 },
      { id: "o2", label: "Esportes", votes: 3210, percentage: 27 },
      { id: "o3", label: "Política", votes: 2890, percentage: 24 },
      { id: "o4", label: "Cultura", votes: 1380, percentage: 11 },
    ],
    totalVotes: 12000, status: "active", createdAt: "Hoje, 20:45",
  },
  {
    id: "p2", question: "Nota para o programa de hoje?", programId: "g1",
    options: [
      { id: "o5", label: "⭐ Excelente", votes: 8900, percentage: 52 },
      { id: "o6", label: "👍 Bom", votes: 5100, percentage: 30 },
      { id: "o7", label: "😐 Regular", votes: 2100, percentage: 12 },
      { id: "o8", label: "👎 Ruim", votes: 900, percentage: 6 },
    ],
    totalVotes: 17000, status: "closed", createdAt: "Ontem, 21:30",
  },
  {
    id: "p3", question: "Quem deve ser o entrevistado da semana?", programId: "s1",
    options: [
      { id: "o9", label: "Político A", votes: 6200, percentage: 45 },
      { id: "o10", label: "Artista B", votes: 4800, percentage: 35 },
      { id: "o11", label: "Atleta C", votes: 2800, percentage: 20 },
    ],
    totalVotes: 13800, status: "active", createdAt: "Hoje, 19:00",
  },
];

export const mockComments: Comment[] = [
  { id: "c1", userName: "Maria S.", text: "Programa incrível hoje! 👏", timestamp: "2min atrás", likes: 45 },
  { id: "c2", userName: "João P.", text: "Adorei a entrevista!", timestamp: "5min atrás", likes: 32 },
  { id: "c3", userName: "Ana L.", text: "Sempre assisto, parabéns!", timestamp: "8min atrás", likes: 28 },
  { id: "c4", userName: "Carlos M.", text: "Melhor apresentador! 🔥", timestamp: "12min atrás", likes: 19 },
  { id: "c5", userName: "Fernanda R.", text: "Quero mais matérias assim", timestamp: "15min atrás", likes: 15 },
  { id: "c6", userName: "Pedro H.", text: "Excelente reportagem sobre economia", timestamp: "18min atrás", likes: 12 },
];

// Get presenter's programs based on host name
export function getPresenterPrograms(hostName: string): TvProgram[] {
  return programs.filter((p) => p.host.toLowerCase().includes(hostName.toLowerCase()));
}

// Generate audience timeline for a single program
export function generateProgramTimeline(programId: string) {
  const program = programs.find((p) => p.id === programId);
  if (!program) return [];
  const base = program.avgAudience;
  const points = [];
  const [startH] = program.startTime.split(":").map(Number);
  const [endH] = program.endTime.split(":").map(Number);
  const hours = endH > startH ? endH - startH : 24 - startH + endH;
  for (let i = 0; i <= hours * 4; i++) {
    const mins = i * 15;
    const h = startH + Math.floor(mins / 60);
    const m = mins % 60;
    const variation = Math.sin(i * 0.5) * 3 + (Math.random() - 0.5) * 2;
    points.push({
      time: `${String(h % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      audience: Math.max(0, +(base + variation).toFixed(1)),
    });
  }
  return points;
}
