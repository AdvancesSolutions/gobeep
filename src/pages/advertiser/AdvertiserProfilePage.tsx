import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Mail, Wallet, PieChart } from "lucide-react";
import { type Advertiser, type Campaign, formatBRL } from "@/data/advertisers";

const AdvertiserProfilePage = ({
  advertiser,
  campaigns,
}: {
  advertiser: Advertiser;
  campaigns: Campaign[];
}) => {
  const [name, setName] = useState(advertiser.name);
  const [email, setEmail] = useState(advertiser.contactEmail);
  const [saved, setSaved] = useState(false);

  const activeCampaigns = campaigns.filter((c) => c.status === "ativa").length;
  const pausedCampaigns = campaigns.filter((c) => c.status === "pausada").length;
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Avatar and name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center text-4xl mb-3">
          {advertiser.logo}
        </div>
        <p className="text-xs text-muted-foreground">{advertiser.industry}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: PieChart, label: "Campanhas Ativas", value: String(activeCampaigns) },
          { icon: Wallet, label: "Total Gasto", value: formatBRL(totalSpent) },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-3.5"
          >
            <item.icon size={14} className="text-primary mb-1" />
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className="text-sm font-bold text-foreground">{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Edit form */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Building2 size={14} className="text-primary" />
          Dados da Empresa
        </h3>

        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
            <Mail size={10} /> E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-[0.98] transition-transform"
        >
          {saved ? "✓ Salvo!" : "Salvar Alterações"}
        </button>
      </div>

      {/* Budget overview */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Resumo Financeiro</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Orçamento Total</span>
            <span className="font-bold text-foreground">{formatBRL(totalBudget)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Gasto</span>
            <span className="font-bold text-foreground">{formatBRL(totalSpent)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Saldo Restante</span>
            <span className="font-bold text-green-500">{formatBRL(totalBudget - totalSpent)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Campanhas Pausadas</span>
            <span className="font-bold text-yellow-500">{pausedCampaigns}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertiserProfilePage;
