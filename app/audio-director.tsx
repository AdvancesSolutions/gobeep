import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { PageHeader } from '../components/PageHeader';
import { usePoints } from '../contexts/PointsContext';
import { 
  Volume2, BarChart3, TrendingUp, Users, DollarSign, Radio, 
  Settings, Plus, Play, MoreHorizontal 
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function AudioDirectorScreen() {
  const { totalPoints } = usePoints();
  const [activeTab, setActiveTab] = useState('overview');

  const StatCard = ({ title, value, subtitle, icon: Icon, color, delay }: any) => (
    <Animated.View entering={FadeInDown.delay(delay)} className="bg-card border border-border p-4 rounded-2xl flex-1 shadow-sm">
      <View className="w-8 h-8 rounded-full items-center justify-center mb-3" style={{ backgroundColor: `${color}20` }}>
        <Icon size={16} color={color} />
      </View>
      <Text className="text-2xl font-black text-foreground mb-1">{value}</Text>
      <Text className="text-[11px] font-bold text-foreground">{title}</Text>
      <Text className="text-[9px] text-muted-foreground mt-1">{subtitle}</Text>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Diretor de Áudio" totalPoints={totalPoints} showBack={true} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInDown.delay(100)} className="bg-[#f0e6d2] border border-[#e6d5b8] p-5 rounded-3xl mb-6 mt-2">
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-12 h-12 bg-[#e6d5b8] rounded-2xl items-center justify-center">
              <Volume2 size={24} color="#b48600" />
            </View>
            <View>
              <Text className="text-lg font-black text-[#5c4400]">Painel de Áudio</Text>
              <Text className="text-xs font-bold text-[#8c6b14]">Gestão de Grade e Monetização</Text>
            </View>
          </View>
          <Text className="text-[11px] text-[#5c4400] mt-2">Crie modelos de negócios para rádio e TV, acompanhe a audiência em tempo real e gerencie campanhas e spots.</Text>
        </Animated.View>

        {/* Custom Tabs */}
        <Animated.View entering={FadeInDown.delay(150)} className="flex-row bg-muted rounded-xl p-1 mb-6">
          <TouchableOpacity 
            onPress={() => setActiveTab('overview')} 
            className={`flex-1 py-2 items-center rounded-lg ${activeTab === 'overview' ? 'bg-background shadow-sm' : ''}`}
          >
            <Text className={`text-[11px] font-bold ${activeTab === 'overview' ? 'text-foreground' : 'text-muted-foreground'}`}>Visão Geral</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('campanhas')} 
            className={`flex-1 py-2 items-center rounded-lg ${activeTab === 'campanhas' ? 'bg-background shadow-sm' : ''}`}
          >
            <Text className={`text-[11px] font-bold ${activeTab === 'campanhas' ? 'text-foreground' : 'text-muted-foreground'}`}>Campanhas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('grade')} 
            className={`flex-1 py-2 items-center rounded-lg ${activeTab === 'grade' ? 'bg-background shadow-sm' : ''}`}
          >
            <Text className={`text-[11px] font-bold ${activeTab === 'grade' ? 'text-foreground' : 'text-muted-foreground'}`}>Grade</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Row */}
        <View className="flex-row gap-3 mb-6">
          <StatCard title="Audiência" value="1.2M" subtitle="+12% essa semana" icon={Users} color="#3b82f6" delay={200} />
          <StatCard title="Receita (R$)" value="84K" subtitle="Spot Ads e Patrocínios" icon={DollarSign} color="#22c55e" delay={300} />
        </View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(400)} className="mb-8">
          <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Ações de Grade</Text>
          <View className="flex-row justify-between gap-3">
            <TouchableOpacity className="flex-1 bg-card border border-border p-4 rounded-2xl items-center shadow-sm">
              <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mb-2">
                <Plus size={20} color="#ffcc00" />
              </View>
              <Text className="font-bold text-foreground text-xs text-center">Novo Spot</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-1 bg-card border border-border p-4 rounded-2xl items-center shadow-sm">
              <View className="w-10 h-10 bg-blue-500/10 rounded-full items-center justify-center mb-2">
                <Radio size={20} color="#3b82f6" />
              </View>
              <Text className="font-bold text-foreground text-xs text-center">Inserção Ao Vivo</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 bg-card border border-border p-4 rounded-2xl items-center shadow-sm">
              <View className="w-10 h-10 bg-muted rounded-full items-center justify-center mb-2">
                <Settings size={20} color="#666" />
              </View>
              <Text className="font-bold text-foreground text-xs text-center">Configurar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Current Grid / Spots running */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Spots em veiculação</Text>
          <View className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {[
              { title: "Campanha Itaú 30s", time: "Hoje, 18:30", status: "Agendado", statusColor: "text-blue-500", bg: "bg-blue-500/10" },
              { title: "Promoção Dia das Mães", time: "Hoje, 15:00", status: "No ar", statusColor: "text-green-500", bg: "bg-green-500/10" },
              { title: "Chamada Jornal da Noite", time: "Ontem, 20:00", status: "Concluído", statusColor: "text-muted-foreground", bg: "bg-muted" },
            ].map((spot, i) => (
              <View key={i} className="flex-row items-center justify-between p-4 border-b border-border/50">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-muted rounded-full items-center justify-center">
                    <Play size={14} color="#666" className="ml-1" />
                  </View>
                  <View>
                    <Text className="font-bold text-foreground text-sm">{spot.title}</Text>
                    <View className="flex-row items-center gap-2 mt-0.5">
                      <Text className="text-[10px] text-muted-foreground">{spot.time}</Text>
                      <View className={`px-1.5 py-0.5 rounded-full ${spot.bg}`}>
                        <Text className={`text-[8px] font-black uppercase ${spot.statusColor}`}>{spot.status}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <TouchableOpacity>
                  <MoreHorizontal size={20} color="#999" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}
