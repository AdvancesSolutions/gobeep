import { motion } from "framer-motion";
import { BarChart3, MessageCircle, Heart, CheckCircle2, Clock } from "lucide-react";
import { mockPolls, mockComments } from "@/data/presenter";

const PresenterPolls = () => {
  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Active Polls */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Enquetes</h3>
        <div className="space-y-3">
          {mockPolls.map((poll, i) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl border border-border p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {poll.status === "active" ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <Clock size={10} /> Ativa
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> Encerrada
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{poll.createdAt}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{poll.question}</p>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                  <BarChart3 size={12} className="text-primary" />
                  <span className="text-[10px] font-bold text-primary">{(poll.totalVotes / 1000).toFixed(1)}k</span>
                </div>
              </div>

              <div className="space-y-2">
                {poll.options.map((opt) => (
                  <div key={opt.id} className="relative">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-semibold text-foreground">{opt.label}</span>
                      <span className="font-bold text-foreground">{opt.percentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${opt.percentage}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          <MessageCircle size={12} className="inline mr-1" />
          Comentários Recentes
        </h3>
        <div className="space-y-2">
          {mockComments.map((comment, i) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="bg-card rounded-xl border border-border p-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {comment.userName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{comment.userName}</span>
                    <span className="text-[10px] text-muted-foreground">{comment.timestamp}</span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-0.5">{comment.text}</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Heart size={12} />
                  <span className="text-[10px] font-semibold">{comment.likes}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PresenterPolls;
