import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePoints } from './PointsContext';
import { useNotifications } from './NotificationsContext';
import { ACHIEVEMENTS, Achievement } from '../constants/achievements';
import * as Haptics from 'expo-haptics';

interface GamificationContextType {
  xp: number;
  level: number;
  nextLevelXp: number;
  streak: number;
  unlockedAchievements: string[];
  newUnlockedAchievement: Achievement | null; // Used to trigger animations
  clearNewAchievement: () => void;
  evaluateAction: (actionType: 'daily_login' | 'audio_recognized' | 'profile_completed', metadata?: any) => void;
}

const GamificationContext = createContext<GamificationContextType>({
  xp: 0,
  level: 1,
  nextLevelXp: 100,
  streak: 0,
  unlockedAchievements: [],
  newUnlockedAchievement: null,
  clearNewAchievement: () => {},
  evaluateAction: () => {},
});

export const useGamification = () => useContext(GamificationContext);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const { addPoints } = usePoints();
  const { addNotification } = useNotifications();

  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [newUnlockedAchievement, setNewUnlockedAchievement] = useState<Achievement | null>(null);

  // Load state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedXp = await AsyncStorage.getItem('beep_xp');
        const storedStreak = await AsyncStorage.getItem('beep_streak');
        const storedAchievements = await AsyncStorage.getItem('beep_achievements');
        
        if (storedXp) setXp(parseInt(storedXp, 10));
        if (storedStreak) setStreak(parseInt(storedStreak, 10));
        if (storedAchievements) setUnlockedAchievements(JSON.parse(storedAchievements));
      } catch (e) {
        console.error("Failed to load gamification state", e);
      }
    };
    loadState();
  }, []);

  // Save state when it changes
  useEffect(() => {
    AsyncStorage.setItem('beep_xp', xp.toString());
    AsyncStorage.setItem('beep_streak', streak.toString());
    AsyncStorage.setItem('beep_achievements', JSON.stringify(unlockedAchievements));
  }, [xp, streak, unlockedAchievements]);

  // Calculate Level based on XP
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelBaseXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;

  const unlockAchievement = useCallback((achievementId: string) => {
    setUnlockedAchievements(prev => {
      if (prev.includes(achievementId)) return prev;
      
      const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (ach) {
        if (ach.rewardBips) {
          addPoints(ach.rewardBips, `Conquista: ${ach.title}`);
        }
        setNewUnlockedAchievement(ach);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return [...prev, achievementId];
    });
  }, [addPoints]);

  const addXp = useCallback((amount: number, reason: string) => {
    setXp(prev => prev + amount);
    // Notification for XP is optional, let's keep it subtle or handle it via UI.
    console.log(`+${amount} XP: ${reason}`);
  }, []);

  const clearNewAchievement = () => setNewUnlockedAchievement(null);

  const evaluateAction = useCallback((actionType: 'daily_login' | 'audio_recognized' | 'profile_completed', metadata?: any) => {
    // 1. Process Actions and award XP
    if (actionType === 'daily_login') {
      addXp(10, 'Login Diário');
      // Update streak (simplified logic, real app would check date strings)
      setStreak(prev => prev + 1);
    } else if (actionType === 'audio_recognized') {
      addXp(50, 'Reconhecimento de Áudio');
    } else if (actionType === 'profile_completed') {
      addXp(100, 'Perfil Completo');
    }

    // 2. Check for newly unlocked achievements
    // Note: React state updates are async, so we use the *expected* state for immediate checks if needed,
    // or rely on useEffect in a more robust system. For simplicity, we'll check based on action.
    
    setTimeout(() => {
      setUnlockedAchievements(currentUnlocked => {
        setStreak(currentStreak => {
          setXp(currentXp => {
            const unlocks: string[] = [];

            // First Beep
            if (actionType === 'audio_recognized' && !currentUnlocked.includes('first_beep')) {
              unlocks.push('first_beep');
            }

            // Night Owl
            if (actionType === 'audio_recognized' && !currentUnlocked.includes('night_owl')) {
              const hour = new Date().getHours();
              if (hour >= 0 && hour <= 4) {
                unlocks.push('night_owl');
              }
            }

            // Streaks
            if (currentStreak >= 3 && !currentUnlocked.includes('streak_3')) unlocks.push('streak_3');
            if (currentStreak >= 7 && !currentUnlocked.includes('streak_7')) unlocks.push('streak_7');

            // Levels / XP
            if (currentXp >= 1600 && !currentUnlocked.includes('level_5')) unlocks.push('level_5');
            if (currentXp >= 5000 && !currentUnlocked.includes('vip')) unlocks.push('vip');

            // Dispatch unlocks sequentially
            unlocks.forEach(id => unlockAchievement(id));

            return currentXp; // returning unchanged state for setXp
          });
          return currentStreak;
        });
        return currentUnlocked;
      });
    }, 100);

  }, [addXp, unlockAchievement]);

  return (
    <GamificationContext.Provider value={{
      xp,
      level,
      nextLevelXp,
      streak,
      unlockedAchievements,
      newUnlockedAchievement,
      clearNewAchievement,
      evaluateAction
    }}>
      {children}
    </GamificationContext.Provider>
  );
};
