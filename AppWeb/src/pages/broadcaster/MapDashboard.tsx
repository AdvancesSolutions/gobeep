import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, TrendingUp, Radio, Map as MapIcon, List, PieChart, Flame, Activity, Rocket, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import HeatmapLayer from '../../components/HeatmapLayer';

const socket = io('http://localhost:3001');

interface UserData {
  name: string;
  age: number;
  gender: string;
  avatar: string;
  interests: string[];
}

interface RecognitionEvent {
  city: string;
  coords: [number, number];
  title: string;
  time: Date;
  user?: UserData;
}

interface CityData {
  name: string;
  coords: [number, number];
  audience: number;
}

const createPulseIcon = (size: number, isPulsing: boolean) => {
  return L.divIcon({
    className: 'custom-pulse-icon',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        <div class="absolute inset-0 rounded-full bg-blue-500 opacity-75 ${isPulsing ? 'animate-ping fast' : ''}"></div>
        <div class="absolute inset-2 rounded-full ${isPulsing ? 'bg-white scale-150' : 'bg-blue-400'} transition-all duration-300"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function MapDashboard() {
  const [activeTab, setActiveTab] = useState<'map' | 'feed' | 'demographics'>('map');
  const [mapMode, setMapMode] = useState<'pulses' | 'heatmap'>('pulses');
  const [data, setData] = useState<CityData[]>([]);
  const [feed, setFeed] = useState<RecognitionEvent[]>([]);
  const [heatmapData, setHeatmapData] = useState<[number, number, number][]>([]);
  const [totalAudience, setTotalAudience] = useState(0);
  const [lastRecognition, setLastRecognition] = useState<RecognitionEvent | null>(null);
  const [pulsingCities, setPulsingCities] = useState<Record<string, boolean>>({});
  
  // Multiplier State
  const [isMultiplierActive, setIsMultiplierActive] = useState(false);
  const [multiplierTimeLeft, setMultiplierTimeLeft] = useState(0);
  const [newsText, setNewsText] = useState("");

  // Poll State
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("Opção A, Opção B, Opção C");

  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Connected to Real-time Server');
    });

    socket.on('new_recognition', (eventData: any) => {
      console.log('🎵 Real-time Recognition:', eventData);
      
      const newEvent: RecognitionEvent = {
        city: eventData.city,
        coords: eventData.coords || [-15.7938, -47.8827],
        title: eventData.title || 'Desconhecido',
        time: new Date(),
        user: eventData.user,
      };

      setLastRecognition(newEvent);
      setFeed(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50

      // Trigger massive pulse
      setPulsingCities(prev => ({ ...prev, [newEvent.city]: true }));
      
      // Add audience to map
      setData(prevData => {
        const newData = [...prevData];
        const cityIndex = newData.findIndex(c => c.name === newEvent.city);
        if (cityIndex >= 0) {
          newData[cityIndex] = {
            ...newData[cityIndex],
            audience: newData[cityIndex].audience + 1
          };
        } else {
          newData.push({
            name: newEvent.city,
            coords: newEvent.coords,
            audience: 1
          });
        }
        return newData;
      });

      setTotalAudience(prev => prev + 1);

      // Update heatmap data
      setHeatmapData(prev => {
         const newPoints = [...prev, [newEvent.coords[0], newEvent.coords[1], 1] as [number, number, number]];
         return newPoints.slice(-1000); // keep max 1000 points
      });

      // Remove pulse after 3 seconds
      setTimeout(() => {
        setPulsingCities(prev => ({ ...prev, [newEvent.city]: false }));
      }, 3000);
    });

    // --- SIMULATION FOR HEATMAP (To visualize density quickly) ---
    const MAJOR_CITIES = [
      [-23.5505, -46.6333], // SP
      [-22.9068, -43.1729], // RJ
      [-19.9167, -43.9345], // BH
      [-15.7938, -47.8827], // BSB
    ];
    
    const interval = setInterval(() => {
      setHeatmapData(prev => {
         // Generate 5 random points around major cities
         const simulatedPoints = Array.from({length: 5}).map(() => {
           const city = MAJOR_CITIES[Math.floor(Math.random() * MAJOR_CITIES.length)];
           const latJitter = (Math.random() - 0.5) * 0.15;
           const lngJitter = (Math.random() - 0.5) * 0.15;
           return [city[0] + latJitter, city[1] + lngJitter, 0.5] as [number, number, number];
         });
         return [...prev, ...simulatedPoints].slice(-2000); // keep max 2000 points for dense heatmap
      });
    }, 500);

    return () => {
      socket.off('connect');
      socket.off('new_recognition');
      clearInterval(interval);
    };
  }, []);

  // Timer for multiplier
  useEffect(() => {
    let timer: any;
    if (multiplierTimeLeft > 0) {
      timer = setInterval(() => {
        setMultiplierTimeLeft(prev => {
          if (prev <= 1) {
            setIsMultiplierActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsMultiplierActive(false);
    }
    return () => clearInterval(timer);
  }, [multiplierTimeLeft]);

  const activateMultiplier = () => {
    socket.emit('start_multiplier', { duration: 180 }); // 3 minutes = 180 seconds
    setIsMultiplierActive(true);
    setMultiplierTimeLeft(180);
  };

  const handleSendNews = () => {
    if (!newsText.trim()) return;
    socket.emit('trigger_tv_alert', {
      title: 'Notícia de Última Hora',
      message: newsText,
      type: 'news'
    });
    setNewsText("");
    alert('Notícia enviada para todas as TVs!');
  };

  const handleSendPoll = () => {
    if (!pollQuestion.trim()) return;
    const optionsArray = pollOptions.split(',').map(o => o.trim()).filter(o => o.length > 0);
    const pollData = {
      id: Math.random().toString(36).substr(2, 9),
      question: pollQuestion,
      options: optionsArray,
      expiresIn: 60, // 60 seconds
    };
    socket.emit('broadcast_poll', pollData);
    setPollQuestion("");
    alert('Enquete enviada para todos os apps e TVs!');
  };

  const handleSendPromo = () => {
    const promoData = {
      id: Math.random().toString(36).substr(2, 9),
      title: "Oferta Exclusiva Beep!",
      description: "Acesse agora o site parceiro e ganhe 50% de desconto.",
      imageUrl: "https://via.placeholder.com/300x150.png?text=Oferta+Parceiro",
      link: "https://beep.app/promo",
    };
    socket.emit('broadcast_promo', promoData);
    alert('Oferta E-commerce disparada para Segunda Tela!');
  };

  // Compute Demographics Data
  const ageGroups = { '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0 };
  const interestsData: Record<string, number> = {};

  feed.forEach(event => {
    if (event.user) {
      if (event.user.age <= 24) ageGroups['18-24']++;
      else if (event.user.age <= 34) ageGroups['25-34']++;
      else if (event.user.age <= 44) ageGroups['35-44']++;
      else ageGroups['45+']++;

      event.user.interests.forEach(interest => {
        interestsData[interest] = (interestsData[interest] || 0) + 1;
      });
    }
  });

  const ageDataChart = Object.entries(ageGroups).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  const interestsDataChart = Object.entries(interestsData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Audiência em Tempo Real 
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Dados ricos de quem está assistindo e interagindo com sua emissora.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex bg-card p-1 rounded-lg border border-border">
            <button 
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <MapIcon size={16} /> Mapa
            </button>
            <button 
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'feed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <List size={16} /> Feed ao Vivo
            </button>
            <button 
              onClick={() => setActiveTab('demographics')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'demographics' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <PieChart size={16} /> Demografia
            </button>
          </div>
          
          {activeTab === 'map' && (
            <div className="flex bg-card p-1 rounded-lg border border-border self-end">
              <button 
                onClick={() => setMapMode('pulses')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${mapMode === 'pulses' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
              >
                <Activity size={14} /> Pulsos Individuais
              </button>
              <button 
                onClick={() => setMapMode('heatmap')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${mapMode === 'heatmap' ? 'bg-red-600 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
              >
                <Flame size={14} /> Heatmap
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ouvintes/Telespectadores</p>
            <h3 className="text-3xl font-bold">{totalAudience.toLocaleString('pt-BR')}</h3>
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex items-center gap-4">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Último Reconhecimento</p>
            <h3 className="text-xl font-bold truncate max-w-[200px]">{lastRecognition ? lastRecognition.city : 'Aguardando...'}</h3>
            <p className="text-xs text-green-500 font-medium">Ao vivo</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between gap-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Painel de Retenção</p>
              <h3 className="text-xl font-bold">Anti-Zapping</h3>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-full">
              <Rocket size={24} />
            </div>
          </div>
          
          {isMultiplierActive ? (
            <div className="bg-red-500/20 border border-red-500 text-red-500 font-bold px-4 py-2 rounded-lg text-center animate-pulse">
              🔥 3X PONTOS ATIVO ({Math.floor(multiplierTimeLeft/60)}:{(multiplierTimeLeft%60).toString().padStart(2, '0')})
            </div>
          ) : (
            <button 
              onClick={activateMultiplier}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              Ativar 3X Pontos (Intervalo)
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Radio size={24} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-2">Alertas na TV</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Envie placares de jogos, alertas ou notícias diretamente para o overlay da Smart TV.
            </p>
            <input 
              type="text"
              value={newsText}
              onChange={(e) => setNewsText(e.target.value)}
              placeholder="Ex: ⚽ Gol do Corinthians!"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground mb-4"
            />
          </div>
          
          <button 
            onClick={handleSendNews}
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
          >
            <Send size={18} /> Disparar para TVs
          </button>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
              <PieChart size={24} className="text-green-500" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-2">Segunda Tela: Interatividade</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Dispare enquetes ao vivo ou ofertas diretas para o celular de quem está assistindo.
            </p>
            <input 
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Pergunta da Enquete (Ex: Qual o melhor filme?)"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground mb-2"
            />
            <input 
              type="text"
              value={pollOptions}
              onChange={(e) => setPollOptions(e.target.value)}
              placeholder="Opções separadas por vírgula"
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground mb-4"
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleSendPoll}
              className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20"
            >
              <Activity size={18} /> Enquete
            </button>
            <button 
              onClick={handleSendPromo}
              className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"
            >
              <Send size={18} /> E-commerce
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-lg relative z-0 overflow-hidden min-h-[600px] flex">
        {/* TAB: MAP */}
        {activeTab === 'map' && (
          <MapContainer 
            center={[-14.235, -51.9253]} 
            zoom={4} 
            style={{ height: '100%', width: '100%', backgroundColor: '#09090b', position: 'absolute', inset: 0 }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap &copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {mapMode === 'heatmap' && <HeatmapLayer points={heatmapData} />}

            {mapMode === 'pulses' && data.map((city, idx) => {
              const size = Math.max(30, Math.min(80, city.audience / 200));
              const isPulsing = pulsingCities[city.name] || false;
              
              return (
                <Marker
                  key={idx}
                  position={city.coords as [number, number]}
                  icon={createPulseIcon(isPulsing ? 80 : size, isPulsing)}
                >
                  <Popup className="custom-popup">
                    <div className="font-bold text-gray-900">{city.name}</div>
                    <div className="text-blue-600 font-medium">{city.audience.toLocaleString('pt-BR')} ouvintes totais</div>
                    {isPulsing && <div className="text-xs text-red-500 font-bold mt-1">🔥 Reconheceu agora!</div>}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* TAB: FEED */}
        {activeTab === 'feed' && (
          <div className="w-full p-6 overflow-y-auto max-h-[600px]">
            <h2 className="text-xl font-bold mb-6">Últimas Interações</h2>
            {feed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Radio size={48} className="opacity-20 mb-4" />
                <p>Nenhuma interação recente.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {feed.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      {item.user ? (
                        <img src={item.user.avatar} alt={item.user.name} className="w-12 h-12 rounded-full border-2 border-primary" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          ?
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white">{item.user ? `${item.user.name}, ${item.user.age} anos` : 'Usuário Anônimo'}</h4>
                        <p className="text-sm text-muted-foreground">{item.city}</p>
                        {item.user && (
                          <div className="flex gap-2 mt-1">
                            {item.user.interests.map(int => (
                              <span key={int} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                {int}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.time.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: DEMOGRAPHICS */}
        {activeTab === 'demographics' && (
          <div className="w-full p-6 grid md:grid-cols-2 gap-8 overflow-y-auto max-h-[600px]">
            {feed.length === 0 ? (
               <div className="col-span-2 flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <PieChart size={48} className="opacity-20 mb-4" />
                  <p>Aguardando dados para gerar os gráficos...</p>
               </div>
            ) : (
              <>
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                  <h3 className="font-bold mb-6 text-lg">Faixa Etária</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie
                        data={ageDataChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {ageDataChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 flex-wrap">
                    {ageDataChart.map((entry, idx) => (
                      <div key={entry.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        {entry.name}: {entry.value}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                  <h3 className="font-bold mb-6 text-lg">Top Interesses</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={interestsDataChart} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                          cursor={{ fill: '#27272a' }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                          {interestsDataChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
