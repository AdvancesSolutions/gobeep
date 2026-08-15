import { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Filter, CheckCircle2, Clock, MapPin, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';

// Componente
export default function PollManager() {
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [data, setData] = useState<{ time: string; candidatoA: number; candidatoB: number }[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);

  // Simular Gráfico em Tempo Real
  useEffect(() => {
    if (activeTab !== 'live') return;

    // Dados Iniciais
    const initialData = Array.from({ length: 20 }).map((_, i) => ({
      time: `-${20 - i}s`,
      candidatoA: 40 + Math.random() * 20,
      candidatoB: 40 + Math.random() * 20,
    }));
    setData(initialData);

    const interval = setInterval(() => {
      setData((prev) => {
        const lastA = prev[prev.length - 1].candidatoA;
        const lastB = prev[prev.length - 1].candidatoB;

        // Variação orgânica (random walk)
        let nextA = lastA + (Math.random() - 0.45) * 8;
        let nextB = lastB + (Math.random() - 0.55) * 8;

        // Manter dentro de limites
        if (nextA < 10) nextA = 10; if (nextA > 90) nextA = 90;
        if (nextB < 10) nextB = 10; if (nextB > 90) nextB = 90;

        const newPoint = {
          time: 'Agora',
          candidatoA: nextA,
          candidatoB: nextB,
        };

        const newData = [...prev.slice(1), newPoint];
        // Atualiza tempos
        return newData.map((d, i) => ({
          ...d,
          time: i === 19 ? 'Agora' : `-${19 - i}s`
        }));
      });
      setTotalVotes(prev => prev + Math.floor(Math.random() * 15) + 5);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <BarChart3 className="text-blue-500" size={32} />
            Termômetro de Debate
          </h1>
          <p className="text-muted-foreground mt-1">Análise de intenção de voto segundo a segundo em rede nacional.</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'live' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <Activity size={16} /> Ao Vivo
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <Clock size={16} /> Histórico
          </button>
        </div>
      </div>

      {activeTab === 'live' && (
        <div className="space-y-6">
          
          {/* Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-center">
              <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2"><Users size={16}/> Total de Votos</p>
              <h2 className="text-4xl font-black">{totalVotes.toLocaleString('pt-BR')}</h2>
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><TrendingUp size={12}/> +{(totalVotes * 0.05).toFixed(0)} no último minuto</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-600/20 border border-blue-500/30 rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
              <p className="text-sm text-blue-200 font-medium mb-1">Candidato A (Governista)</p>
              <h2 className="text-4xl font-black text-blue-400">
                {data.length > 0 ? data[19].candidatoA.toFixed(1) : '0'}%
              </h2>
            </div>
            
            <div className="bg-gradient-to-br from-red-900/40 to-red-600/20 border border-red-500/30 rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
              <p className="text-sm text-red-200 font-medium mb-1">Candidato B (Oposição)</p>
              <h2 className="text-4xl font-black text-red-400">
                {data.length > 0 ? data[19].candidatoB.toFixed(1) : '0'}%
              </h2>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-center">
              <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2"><MapPin size={16}/> Região Dominante</p>
              <h2 className="text-2xl font-black">Sudeste (58%)</h2>
              <p className="text-xs text-muted-foreground mt-2">Maior engajamento</p>
            </div>
          </div>

          {/* Real-time Chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <Activity size={18} className="text-green-500 animate-pulse"/> Sentimento da Resposta (Tempo Real)
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div> Candidato A
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div> Candidato B
                </div>
              </div>
            </div>
            
            <div className="h-[400px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" stroke="#888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="candidatoA" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={false}
                    activeDot={{ r: 8 }}
                    animationDuration={300}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="candidatoB" 
                    stroke="#ef4444" 
                    strokeWidth={4} 
                    dot={false}
                    activeDot={{ r: 8 }}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-border">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Filter size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Relatórios Consolidados</h2>
          <p className="text-muted-foreground max-w-md">O histórico de debates passados fica disponível após o processamento dos dados demográficos.</p>
        </div>
      )}
    </div>
  );
}
