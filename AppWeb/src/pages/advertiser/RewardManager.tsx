import { useState, useEffect } from 'react';
import { Store, ShoppingBag, PlusCircle, ArrowUpRight, TrendingUp, Percent, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { initialVouchers, type Voucher } from '../../data/vouchers';
import { io } from 'socket.io-client';

const socket = io("http://localhost:3002");

const REDEEM_DATA = [
  { name: 'Seg', resgates: 400 },
  { name: 'Ter', resgates: 300 },
  { name: 'Qua', resgates: 550 },
  { name: 'Qui', resgates: 450 },
  { name: 'Sex', resgates: 800 },
  { name: 'Sáb', resgates: 1200 },
  { name: 'Dom', resgates: 950 },
];

export default function RewardManager() {
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [liveRedeems, setLiveRedeems] = useState(1205); // starting mock value
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    socket.on('voucher_redeemed', (data) => {
      // Flash green effect
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 2000);

      // Increment live redeems
      setLiveRedeems(prev => prev + 1);

      // Decrement stock and increment redeemed for the specific voucher
      setVouchers(prevVouchers => 
        prevVouchers.map(v => 
          v.id === data.voucherId 
            ? { ...v, stock: v.stock - 1, redeemed: v.redeemed + 1 }
            : v
        )
      );
    });

    return () => {
      socket.off('voucher_redeemed');
    };
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Store className="text-yellow-500" size={32} />
            Marketplace Beep
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie seu Estoque Digital e acompanhe conversões Offline-para-Online.</p>
        </div>
        
        <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2">
          <PlusCircle size={20} /> Adicionar Vouchers
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground font-medium mb-1">Custo de Aquisição (CAC)</p>
          <h2 className="text-4xl font-black text-green-400">R$ 0,00</h2>
          <p className="text-xs text-muted-foreground mt-2">Pagamento 100% em produtos</p>
        </div>
        
        <div className={`bg-card border border-border rounded-xl p-6 relative overflow-hidden transition-colors duration-500 ${isPulsing ? 'bg-green-500/20 border-green-500' : ''}`}>
          {isPulsing && <div className="absolute inset-0 bg-green-500/10 animate-pulse pointer-events-none" />}
          <div className="flex justify-between items-start">
            <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2"><ShoppingBag size={16}/> Resgates (Hoje)</p>
            {isPulsing && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Ao Vivo</span>
              </div>
            )}
          </div>
          <h2 className="text-4xl font-black">{liveRedeems.toLocaleString('pt-BR')}</h2>
          <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><ArrowUpRight size={12}/> +14% vs. ontem</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2"><Package size={16}/> Estoque Digital</p>
          <h2 className="text-4xl font-black">{vouchers.reduce((acc, v) => acc + v.stock, 0).toLocaleString('pt-BR')}</h2>
          <p className="text-xs text-muted-foreground mt-2">Vouchers disponíveis</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2"><Percent size={16}/> Taxa de Conversão</p>
          <h2 className="text-4xl font-black text-yellow-500">28.4%</h2>
          <p className="text-xs text-muted-foreground mt-2">De resgates em lojas físicas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Gráfico de Resgates */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
          <h3 className="font-bold flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-yellow-500"/> Volume de Resgates na Semana
          </h3>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REDEEM_DATA}>
                <defs>
                  <linearGradient id="colorResgates" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="resgates" 
                  stroke="#eab308" 
                  fillOpacity={1} 
                  fill="url(#colorResgates)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lista de Vouchers */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-bold mb-6">Campanhas Ativas</h3>
          <div className="space-y-4">
            {vouchers.map(v => (
              <div key={v.id} className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm">{v.brand}</h4>
                    <p className="text-xs text-muted-foreground">{v.product}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${v.status === 'Ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {v.status}
                  </span>
                </div>
                
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Resgatados: {v.redeemed} / {v.stock}</span>
                    <span className="text-yellow-500 font-bold">{Math.round((v.redeemed/v.stock)*100)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div 
                      className="bg-yellow-500 h-1.5 rounded-full" 
                      style={{ width: `${(v.redeemed/v.stock)*100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-2 text-xs font-bold text-white bg-white/10 self-start px-2 py-1 rounded">
                  Custo: {v.cost} Bips
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
