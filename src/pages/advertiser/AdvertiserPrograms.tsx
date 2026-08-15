import { motion } from "framer-motion";
import { type Campaign, formatBRL, formatNumber } from "@/data/advertisers";
import { programs, broadcasters } from "@/data/broadcasters";

const AdvertiserPrograms = ({ campaigns }: { campaigns: Campaign[] }) => {
  // Get unique programs this advertiser is in
  const programIds = [...new Set(campaigns.flatMap((c) => c.programIds))];
  const advertiserPrograms = programs.filter((p) => programIds.includes(p.id));

  return (
    <div className="px-4 py-5 space-y-4">
      <h3 className="text-sm font-bold text-foreground">Programas com Anúncios</h3>

      {advertiserPrograms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum programa associado</p>
      ) : (
        <div className="space-y-3">
          {advertiserPrograms.map((program, i) => {
            const broadcaster = broadcasters.find((b) => b.id === program.broadcasterId);
            const relatedCampaigns = campaigns.filter((c) => c.programIds.includes(program.id));
            const totalImpressions = relatedCampaigns.reduce((s, c) => s + c.impressions, 0);

            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: broadcaster ? `${broadcaster.color}20` : undefined }}
                  >
                    {broadcaster?.logo || "📺"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{program.name}</p>
                    <p className="text-[10px] text-muted-foreground">{broadcaster?.name} · {program.host}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{program.startTime}–{program.endTime} · {program.daysOfWeek.join(", ")}</p>

                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Audiência</p>
                        <p className="text-xs font-bold text-foreground">{program.currentAudience} pts</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Preço/Slot</p>
                        <p className="text-xs font-bold text-foreground">{formatBRL(program.adPricePerSlot)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Campanhas</p>
                        <p className="text-xs font-bold text-foreground">{relatedCampaigns.length}</p>
                      </div>
                    </div>

                    {/* Slots bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-muted-foreground">Slots vendidos</span>
                        <span className="text-[10px] font-semibold text-foreground">{program.adSlotsSold}/{program.adSlotsTotal}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(program.adSlotsSold / program.adSlotsTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdvertiserPrograms;
