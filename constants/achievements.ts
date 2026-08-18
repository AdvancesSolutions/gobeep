import { Mic, Trophy, Calendar, Moon, Zap, Star } from 'lucide-react-native';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  requiredXp?: number;
  rewardBips?: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_beep",
    title: "Primeiro Beep",
    description: "Fez seu primeiro reconhecimento de áudio com sucesso.",
    icon: Mic,
    color: "#3b82f6", // blue
    rewardBips: 50,
  },
  {
    id: "streak_3",
    title: "Consistência I",
    description: "Acessou o app por 3 dias consecutivos.",
    icon: Calendar,
    color: "#22c55e", // green
    rewardBips: 100,
  },
  {
    id: "streak_7",
    title: "Consistência II",
    description: "Acessou o app por 7 dias consecutivos.",
    icon: Zap,
    color: "#eab308", // yellow
    rewardBips: 250,
  },
  {
    id: "night_owl",
    title: "Coruja",
    description: "Reconheceu um áudio durante a madrugada (00:00 - 04:00).",
    icon: Moon,
    color: "#8b5cf6", // purple
    rewardBips: 75,
  },
  {
    id: "level_5",
    title: "Explorador Nato",
    description: "Atingiu o Nível 5 de Experiência.",
    icon: Star,
    color: "#ec4899", // pink
    rewardBips: 500,
  },
  {
    id: "vip",
    title: "VIP",
    description: "Acumulou mais de 5.000 XP.",
    icon: Trophy,
    color: "#ffcc00", // Beep Yellow
    rewardBips: 1000,
  }
];
