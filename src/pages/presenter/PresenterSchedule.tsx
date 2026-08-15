import { motion } from "framer-motion";
import { Calendar, Clock, Radio } from "lucide-react";
import { type TvProgram } from "@/data/broadcasters";

interface Props {
  programs: TvProgram[];
}

const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const PresenterSchedule = ({ programs }: Props) => {
  // Build schedule: for each day show which programs air
  const schedule = days.map((day) => ({
    day,
    programs: programs.filter((p) => p.daysOfWeek.includes(day)),
  }));

  return (
    <div className="px-4 pt-4 space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          <Calendar size={12} className="inline mr-1" />
          Minha Agenda
        </h3>
      </motion.div>

      <div className="space-y-3">
        {schedule.map((s, i) => (
          <motion.div
            key={s.day}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card rounded-2xl border border-border p-3.5"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <span className="text-xs font-black text-primary">{s.day}</span>
              </div>
              <span className="text-sm font-bold text-foreground">{s.day === "Sáb" ? "Sábado" : s.day === "Dom" ? "Domingo" : s.day === "Seg" ? "Segunda" : s.day === "Ter" ? "Terça" : s.day === "Qua" ? "Quarta" : s.day === "Qui" ? "Quinta" : "Sexta"}</span>
              <span className="ml-auto text-[10px] text-muted-foreground font-medium">{s.programs.length} programa{s.programs.length !== 1 ? "s" : ""}</span>
            </div>

            {s.programs.length > 0 ? (
              <div className="space-y-2">
                {s.programs.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-muted/50 rounded-xl p-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Radio size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.genre}</p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock size={11} />
                      <span className="text-[10px] font-semibold">{p.startTime} - {p.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground/60 text-center py-2">Sem programas</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PresenterSchedule;
