import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronLeft, Trophy } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { beepLogoBase64 } from '../constants/logos';
import { TVControlButton } from './TVControlButton';

interface PageHeaderProps {
  title: string;
  totalPoints?: number;
  onBack?: () => void;
  showBack?: boolean;
  isDark?: boolean;
  showTVControl?: boolean;
}

export function PageHeader({ title, totalPoints, onBack, showBack = true, isDark = false, showTVControl = false }: PageHeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View 
      style={{ 
        paddingTop: insets.top + 16, 
        paddingBottom: 16, 
        paddingHorizontal: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }} 
      className="z-40"
    >
      <View className="flex-row items-center gap-3">
        {showBack && (
          <TouchableOpacity 
            onPress={handleBack} 
            className={`w-10 h-10 rounded-full items-center justify-center active:scale-95 transition-transform ${isDark ? 'bg-white/10' : 'bg-[#1a1a1a]'}`}
          >
            <ChevronLeft size={20} color={isDark ? "#fff" : "#fff"} />
          </TouchableOpacity>
        )}
        <View className="flex-row items-center gap-2.5">
          <Image source={{ uri: beepLogoBase64 }} style={{ width: 28, height: 28 }} resizeMode="contain" />
          <View className={`w-[1px] h-5 ${isDark ? 'bg-white/30' : 'bg-border/80'}`} />
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>{title}</Text>
        </View>
      </View>
      
      {totalPoints !== undefined && (
        <View className="flex-row items-center gap-1.5 bg-[#f0e6d2] px-3 py-1.5 rounded-full border border-[#e6d5b8]">
          <Trophy size={14} color="#b48600" />
          <Text className="font-bold text-[#b48600]">{totalPoints}</Text>
        </View>
      )}

      {showTVControl && <TVControlButton />}
    </View>
  );
}
