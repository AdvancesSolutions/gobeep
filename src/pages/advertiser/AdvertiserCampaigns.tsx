import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Pause, CheckCircle, Play } from "lucide-react";
import { type Campaign, formatBRL, formatNumber } from "@/data/advertisers";
import { programs } from "@/data/broadcasters";

const statusConfig = {
  ativa: { label: "Ativa", color: "text-green-500", bg: "bg-green-500/15", icon: Play },
  pausada: { label: "Pausada", color: "text-yellow-500", bg: "bg-yellow-500/15", icon: Pause },
  encerrada: { label: "Encerrada", color: "text-muted-foreground", bg: "bg-muted", icon: CheckCircle },
};

const AdvertiserCampaigns = ({ campaigns }: { campaigns: Campaign[] }) => {
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const avgCtr = campaigns.length ? (totalClicks / totalImpressions * 100) : 0;

  const kpis = [
    { label: "Impressões", value: formatNumber(totalImpressions), icon: "👁️" },
    { label: "Cliques", value: formatNumber(totalClicks), icon: "👆" },
    { label: "Alcance", value: formatNumber(totalReach), icon: "📡" },
    { label: "CTR Médio", value: `${avgCtr.toFixed(1)}%`, icon: "📊" },
  ];

  return (
    <div className="px-4 py-5 space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-3.5"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{kpi.icon}</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className="text-lg font-black text-foreground">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Budget bar */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground">Orçamento Total</span>
          <span className="text-xs text-muted-foreground">{formatBRL(totalSpent)} gastos</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(totalSpent / campaigns.reduce((s, c) => s + c.budget, 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-primary rounded-full"
          />
        </div>
      </div>

      {/* Campaigns list */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Campanhas</h3>
        <div className="space-y-3">
          {campaigns.map((campaign, i) => {
            const config = statusConfig[campaign.status];
            const StatusIcon = config.icon;
            const progressPct = (campaign.spent / campaign.budget) * 100;
            const campaignPrograms = programs.filter((p) => campaign.programIds.includes(p.id));

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card rounded-2xl border border-border p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{campaign.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {campaign.startDate} → {campaign.endDate}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${config.bg}`}>
                    <StatusIcon size={10} className={config.color} />
                    <span className={`text-[10px] font-bold ${config.color}`}>{config.label}</span>
                  </div>
                </div>

                {/* Programs */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {campaignPrograms.map((p) => (
                    <span key={p.id} className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                      {p.name}
                    </span>
                  ))}
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Impressões</p>
                    <p className="text-xs font-bold text-foreground">{formatNumber(campaign.impressions)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Cliques</p>
                    <p className="text-xs font-bold text-foreground">{formatNumber(campaign.clicks)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">CTR</p>
                    <p className="text-xs font-bold text-foreground">{campaign.ctr}%</p>
                  </div>
                </div>

                {/* Budget progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Orçamento</span>
                    <span className="text-[10px] font-semibold text-foreground">
                      {formatBRL(campaign.spent)} / {formatBRL(campaign.budget)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdvertiserCampaigns;
