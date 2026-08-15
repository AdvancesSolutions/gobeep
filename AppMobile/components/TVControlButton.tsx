import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Tv } from 'lucide-react-native';
import { router } from 'expo-router';

export function TVControlButton() {
  return (
    <TouchableOpacity
      onPress={() => router.push('/tv-remote')}
      className="w-10 h-10 rounded-full bg-card-dark-foreground/10 items-center justify-center"
    >
      <Tv size={18} color="#fff" />
    </TouchableOpacity>
  );
}

export default TVControlButton;
