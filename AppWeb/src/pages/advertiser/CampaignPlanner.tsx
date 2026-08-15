import { useState, useEffect } from 'react';
import { Megaphone, Target, DollarSign, BarChart3, Clock, Zap, ArrowRight, ShieldCheck, CheckCircle2, TrendingUp, Tv } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const INTERESTS = ['Música', 'Esportes', 'Notícias', 'Política', 'Beleza', 'Tecnologia', 'Games', 'Culinária'];
const DAYS_DATA = [
  { day: 'Seg', efficiency: 65 },
  { day: 'Ter', efficiency: 85 },
  { day: 'Qua', efficiency: 70 },
  { day: 'Qui', efficiency: 90 },
  { day: 'Sex', efficiency: 95 },
  { day: 'Sáb', efficiency: 40 },
  { day: 'Dom', efficiency: 55 },
];

export default function CampaignPlanner() {
  const [budget, setBudget] = useState(5000);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [targetAge, setTargetAge] = useState('18-24');
  const [targetGender, setTargetGender] = useState('Todos');
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const simulateCampaign = () => {
    setIsCalculating(true);
    setResults(null);
    
    // Fake loading delay to look like AI processing
    setTimeout(() => {
      // Calculate fake metrics based on inputs
      const baseConversion = Math.floor(budget / 1.5);
      const interestMultiplier = selectedInterests.length > 0 ? 1.2 : 1;
      const expectedBips = Math.floor(baseConversion * interestMultiplier);
      const cpa = (budget / expectedBips).toFixed(2);
      const roi = Math.floor((expectedBips * 15 - budget) / budget * 100); // Fake ROI
      
      setResults({
        expectedBips,
        cpa,
        roi,
        bestTime: 'Sexta-feira, 20h às 22h',
        recommendedChannels: ['TV Globo (Novela)', 'Rádio Jovem Pan (Morning)'],
      });
      setIsCalculating(false);
    }, 1500);
  };

  useEffect(() => {
    // Run an initial simulation
    simulateCampaign();
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Megaphone className="text-primary" /> Simulador de Campanhas
        </h1>
        <p className="text-muted-foreground mt-1">
          Descubra onde e quando anunciar usando os dados de audiência real do BeepApp.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Setup */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Target size={20} className="text-blue-500" /> Definição de Público
            </h2>

            <div className="space-y-6">
              {/* Budget */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center justify-between">
                  Orçamento Mensal
                  <span className="text-primary font-bold text-lg">R$ {budget.toLocaleString('pt-BR')}</span>
                </label>
                <input 
                  type="range" 
                  min="500" 
                  max="50000" 
                  step="500"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Age */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Faixa Etária Alvo</label>
                <div className="grid grid-cols-2 gap-2">
                  {['18-24', '25-34', '35-44', '45+'].map(age => (
                    <button
                      key={age}
                      onClick={() => setTargetAge(age)}
                      className={`py-2 rounded-md border text-sm font-medium transition-colors ${targetAge === age ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-white/5'}`}
                    >
                      {age} anos
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Gênero</label>
                <div className="flex gap-2">
                  {['Todos', 'Masculino', 'Feminino'].map(gender => (
                    <button
                      key={gender}
                      onClick={() => setTargetGender(gender)}
                      className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${targetGender === gender ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-white/5'}`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Interesses do Público</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${selectedInterests.includes(interest) ? 'bg-blue-500 border-blue-500 text-white' : 'border-border text-muted-foreground hover:bg-white/5'}`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={simulateCampaign}
                disabled={isCalculating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
              >
                {isCalculating ? (
                  <span className="animate-pulse">Processando IA...</span>
                ) : (
                  <>Calcular Melhor Estratégia <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {isCalculating ? (
             <div className="flex-1 bg-card border border-border rounded-xl flex flex-col items-center justify-center min-h-[400px]">
               <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
               <h3 className="text-xl font-bold">Analisando Banco de Dados...</h3>
               <p className="text-muted-foreground">Cruzando perfis com dados de mapas de calor das emissoras...</p>
             </div>
          ) : results ? (
            <>
              {/* Top KPIs */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={64} /></div>
                  <p className="text-sm font-medium text-muted-foreground">Bips Estimados</p>
                  <h3 className="text-4xl font-black text-white mt-1">{results.expectedBips.toLocaleString('pt-BR')}</h3>
                  <p className="text-xs text-green-500 font-bold mt-2 flex items-center gap-1"><TrendingUp size={12}/> Alta conversão</p>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={64} /></div>
                  <p className="text-sm font-medium text-muted-foreground">Custo Por Bip (CPA)</p>
                  <h3 className="text-4xl font-black text-white mt-1">R$ {results.cpa}</h3>
                  <p className="text-xs text-muted-foreground mt-2">Dentro da média do mercado</p>
                </div>

                <div className="bg-gradient-to-br from-green-600/20 to-emerald-900/40 border border-green-500/30 rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
                  <p className="text-sm font-medium text-green-400">ROI Projetado</p>
                  <h3 className="text-4xl font-black text-green-500 mt-1">+{results.roi}%</h3>
                  <p className="text-xs text-green-400/70 mt-2">Retorno sobre investimento</p>
                </div>
              </div>

              {/* Recommendation Panel */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-bold mb-6 flex items-center gap-2">
                    <BarChart3 size={18} className="text-purple-500"/> Eficiência por Dia da Semana
                  </h3>
                  <div className="h-[200px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={DAYS_DATA}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                        <Tooltip 
                          cursor={{ fill: '#27272a' }}
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        />
                        <Bar dataKey="efficiency" radius={[4, 4, 0, 0]}>
                          {DAYS_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.day === 'Sex' ? '#8b5cf6' : '#3f3f46'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Verdict */}
                <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-green-500"/> Veredito da IA
                    </h3>
                    
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mb-4">
                      <p className="text-sm text-blue-200">
                        O melhor momento para anunciar para <strong>{targetGender === 'Todos' ? 'pessoas' : targetGender === 'Masculino' ? 'homens' : 'mulheres'}</strong> de <strong>{targetAge} anos</strong> interessados em <strong>{selectedInterests.length > 0 ? selectedInterests[0] : 'variedades'}</strong> é na:
                      </p>
                      <h4 className="text-xl font-black text-blue-400 mt-2 flex items-center gap-2">
                        <Clock size={20}/> {results.bestTime}
                      </h4>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">Emissoras Recomendadas para este público:</p>
                    <ul className="space-y-2">
                      {results.recommendedChannels.map((ch: string) => (
                        <li key={ch} className="flex items-center gap-2 text-sm font-medium text-white">
                          <CheckCircle2 size={16} className="text-green-500" /> {ch}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors mt-6">
                    Exportar Mídia Kit Completo
                  </button>
                </div>
              </div>

              {/* Retargeting Funnel */}
              <div className="bg-card border border-border rounded-xl p-6 mt-2">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-yellow-500"/> Funil de Conversão Ao Vivo (Retargeting)
                </h3>
                <p className="text-sm text-muted-foreground mb-6">Acompanhe a jornada do usuário: da TV até o celular.</p>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  {/* Step 1 */}
                  <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl p-6 text-center relative">
                     <h4 className="text-3xl font-black text-blue-500 mb-2">100%</h4>
                     <p className="text-sm font-medium text-white">Biparam a Propaganda na TV</p>
                     <p className="text-xs text-muted-foreground mt-1">({results.expectedBips.toLocaleString('pt-BR')} usuários)</p>
                     <div className="hidden md:block absolute right-[-20px] top-1/2 transform -translate-y-1/2 z-10 text-muted-foreground">
                       <ArrowRight size={24} />
                     </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl p-6 text-center relative">
                     <h4 className="text-3xl font-black text-yellow-500 mb-2 animate-pulse">45%</h4>
                     <p className="text-sm font-medium text-white">Receberam Push Notification</p>
                     <p className="text-xs text-muted-foreground mt-1">"Quer fazer um Test Drive?"</p>
                     <div className="hidden md:block absolute right-[-20px] top-1/2 transform -translate-y-1/2 z-10 text-muted-foreground">
                       <ArrowRight size={24} />
                     </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex-1 w-full bg-gradient-to-br from-green-600/20 to-emerald-900/40 border border-green-500/30 rounded-xl p-6 text-center">
                     <h4 className="text-3xl font-black text-green-500 mb-2">12%</h4>
                     <p className="text-sm font-medium text-green-400">Agendaram o Test Drive</p>
                     <p className="text-xs text-green-400/70 mt-1">Conversão Física Sucesso</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
}
