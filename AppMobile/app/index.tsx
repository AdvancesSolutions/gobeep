import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Dimensions, Platform, ScrollView, Image, Keyboard, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, FadeIn, FadeOut, SlideInRight, SlideOutLeft, withSequence, Easing, withRepeat, withDelay, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { User, Sparkles, ChevronRight, Check, Trophy, Plus, Sun, Moon, Tv } from 'lucide-react-native';
import { beepLogoBase64 } from '../constants/logos';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { usePoints } from '../contexts/PointsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width, height } = Dimensions.get('window');

const DEFAULT_INTERESTS = [
  { id: "politica", label: "Política", emoji: "🏛️" },
  { id: "esportes", label: "Esportes", emoji: "⚽" },
  { id: "novelas", label: "Novelas", emoji: "📺" },
  { id: "musica", label: "Música", emoji: "🎵" },
  { id: "tecnologia", label: "Tecnologia", emoji: "💻" },
  { id: "humor", label: "Humor", emoji: "😂" },
  { id: "noticias", label: "Notícias", emoji: "📰" },
  { id: "cinema", label: "Cinema", emoji: "🎬" },
];

const POINTS_NAME = 30;
const POINTS_PER_INTEREST = 10;
const MAX_INTEREST_POINTS = 80;

const HexagonItem = ({ pos, index }: { pos: { x: string, y: string, size: number }, index: number }) => {
  const svY = useSharedValue(0);
  useEffect(() => {
    svY.value = withDelay(index * 500, withRepeat(withSequence(
      withTiming(-20, { duration: 3000 + index * 1000, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 3000 + index * 1000, easing: Easing.inOut(Easing.ease) })
    ), -1, true));
  }, [index, svY]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: svY.value }, { rotate: '45deg' }],
  }));
  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: pos.size, height: pos.size,
        left: pos.x, top: pos.y,
        backgroundColor: 'hsla(30, 50%, 15%, 0.03)',
        borderRadius: 16,
      }, animStyle]}
    />
  );
};

const Hexagons = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[
        { x: "5%", y: "20%", size: 60 },
        { x: "80%", y: "10%", size: 40 },
        { x: "60%", y: "60%", size: 50 },
        { x: "15%", y: "75%", size: 35 },
        { x: "90%", y: "50%", size: 45 },
        { x: "40%", y: "30%", size: 30 },
      ].map((pos, i) => (
        <HexagonItem key={i} pos={pos} index={i} />
      ))}
    </View>
  );
};

const Particle = ({ i }: { i: number }) => {
  const svY = useSharedValue(0);
  const svX = useSharedValue(0);
  const svScale = useSharedValue(0);
  const svOpacity = useSharedValue(0);
  
  const size = 3 + Math.random() * 6;
  const left = `${5 + Math.random() * 90}%`;
  const top = `${5 + Math.random() * 90}%`;
  const delay = i * 200;
  const dur = 4000 + Math.random() * 4000;
  
  useEffect(() => {
    svOpacity.value = withDelay(delay, withRepeat(
      withSequence(withTiming(0.8, { duration: dur / 2 }), withTiming(0, { duration: dur / 2 })), -1, false
    ));
    svScale.value = withDelay(delay, withRepeat(
      withSequence(withTiming(1.5, { duration: dur / 2 }), withTiming(0, { duration: dur / 2 })), -1, false
    ));
    svY.value = withDelay(delay, withRepeat(withTiming(-40 - Math.random() * 60, { duration: dur }), -1, false));
    svX.value = withDelay(delay, withRepeat(withTiming((Math.random() - 0.5) * 40, { duration: dur }), -1, false));
  }, [svOpacity, svScale, svY, svX, delay, dur]);

  const style = useAnimatedStyle(() => ({
    opacity: svOpacity.value,
    transform: [{ scale: svScale.value }, { translateY: svY.value }, { translateX: svX.value }],
    left: left as any, top: top as any,
    width: size, height: size,
    position: 'absolute',
    backgroundColor: `hsla(45, 100%, ${50 + Math.random() * 20}%, ${0.2 + Math.random() * 0.4})`,
    borderRadius: 999,
  }));
  return <Animated.View style={style} pointerEvents="none" />;
};

const Ring = ({ i }: { i: number }) => {
  const svScale = useSharedValue(0.5);
  const svOpacity = useSharedValue(0);
  const baseWidth = 140 + i * 50;
  
  useEffect(() => {
    const delay = i * 800;
    svScale.value = withDelay(delay, withRepeat(
      withSequence(withTiming(1.2, { duration: 1500 }), withTiming(0.5, { duration: 1500 })), -1, false
    ));
    svOpacity.value = withDelay(delay, withRepeat(
      withSequence(withTiming(0.4, { duration: 1500 }), withTiming(0, { duration: 1500 })), -1, false
    ));
  }, [svScale, svOpacity, i]);

  const style = useAnimatedStyle(() => ({
    opacity: svOpacity.value,
    transform: [{ scale: svScale.value }],
    width: baseWidth, height: baseWidth,
    borderRadius: baseWidth / 2,
    borderWidth: 1,
    borderColor: `hsla(45, 100%, 50%, ${0.08 - i * 0.02})`,
    position: 'absolute',
  }));
  return <Animated.View style={style} pointerEvents="none" />;
};

const LogoGlow = () => {
  const svOpacity = useSharedValue(0.3);
  const svScale = useSharedValue(1);

  useEffect(() => {
    svScale.value = withRepeat(
      withSequence(withTiming(1.6, { duration: 1500 }), withTiming(1, { duration: 1500 })), -1, true
    );
    svOpacity.value = withRepeat(
      withSequence(withTiming(0.8, { duration: 1500 }), withTiming(0.3, { duration: 1500 })), -1, true
    );
  }, [svScale, svOpacity]);

  const style = useAnimatedStyle(() => ({
    opacity: svOpacity.value,
    transform: [{ scale: svScale.value }],
    width: 240, height: 240,
    position: 'absolute',
  }));

  return (
    <Animated.View style={style} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="hsl(45, 100%, 50%)" stopOpacity="0.25" />
            <Stop offset="70%" stopColor="hsl(45, 100%, 50%)" stopOpacity="0.05" />
            <Stop offset="100%" stopColor="hsl(45, 100%, 50%)" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>
    </Animated.View>
  );
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(-1); // -1 = splash
  const [name, setName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);

  const insets = useSafeAreaInsets();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { addPoints } = usePoints();

  // Animations
  const blobHeight = useSharedValue(height * 0.55);
  const blobBorder = useSharedValue(height * 0.5);
  const splashOpacity = useSharedValue(1);
  const splashScale = useSharedValue(1);
  
  const faceScale = useSharedValue(1);
  const faceRotate = useSharedValue(0);
  const faceTranslateY = useSharedValue(0);
  const smileScaleX = useSharedValue(1);
  const smileScaleY = useSharedValue(1);
  const smileTranslateY = useSharedValue(0);
  const eyeScaleY = useSharedValue(1);
  const eyeScaleX = useSharedValue(1);
  const stepPulse = useSharedValue(1); // pulso do indicador no step 3/3

  // Pulso no indicador final (step 3/3) para sinalizar conclusao
  useEffect(() => {
    if (step === 2) {
      stepPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ), -1, true
      );
    } else {
      stepPulse.value = withTiming(1, { duration: 200 });
    }
  }, [step, stepPulse]);

  const stepPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stepPulse.value }],
  }));

  // Animates the avatar and text size/margins when keyboard is shown
  const avatarAnimatedStyle = useAnimatedStyle(() => {
    const scale = withTiming(keyboardVisible ? 0.6 : 1, { duration: 200 });
    const marginBottom = withTiming(keyboardVisible ? 8 : 24, { duration: 200 });
    const opacity = withTiming(keyboardVisible ? 0.8 : 1, { duration: 200 });
    return {
      transform: [{ scale }],
      marginBottom,
      opacity,
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const scale = withTiming(keyboardVisible ? 0.85 : 1, { duration: 200 });
    const marginBottom = withTiming(keyboardVisible ? 4 : 8, { duration: 200 });
    return {
      transform: [{ scale }],
      marginBottom,
    };
  });

  const subtitleAnimatedStyle = useAnimatedStyle(() => {
    const scale = withTiming(keyboardVisible ? 0.8 : 1, { duration: 200 });
    const marginBottom = withTiming(keyboardVisible ? 12 : 32, { duration: 200 });
    const opacity = withTiming(keyboardVisible ? 0.5 : 0.7, { duration: 200 });
    return {
      transform: [{ scale }],
      marginBottom,
      opacity,
    };
  });
  useEffect(() => {
    if (step === -1) {
      faceRotate.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(2, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ), -1, true
      );
      smileTranslateY.value = withRepeat(
        withSequence(
          withTiming(-1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ), -1, true
      );
      eyeScaleY.value = withDelay(1500, withRepeat(
        withSequence(
          withTiming(0.1, { duration: 150 }),
          withTiming(1, { duration: 150 }),
          withDelay(3000, withTiming(1, { duration: 0 }))
        ), -1, false
      ));
    }
  }, [step, faceRotate, smileTranslateY, eyeScaleY]);

  // Keyboard
  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const totalSelected = selectedInterests.length;
  const nameCompleted = name.trim().length > 0;
  const interestPoints = Math.min(totalSelected * POINTS_PER_INTEREST, MAX_INTEREST_POINTS);
  const namePoints = nameCompleted ? POINTS_NAME : 0;
  const totalPossiblePoints = namePoints + interestPoints;

  const toggleInterest = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const addCustomInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !customInterests.includes(trimmed)) {
      setCustomInterests(prev => [...prev, trimmed]);
      setSelectedInterests(prev => [...prev, trimmed]);
      setNewInterest("");
    }
  };

  const goNext = () => {
    if (step === -1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Big smile animation!
      faceScale.value = withSpring(1.12, { damping: 10 });
      faceRotate.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(-3, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
      faceTranslateY.value = withSpring(-10, { damping: 15 });
      
      smileScaleX.value = withSpring(1.25, { damping: 12 });
      smileScaleY.value = withSpring(1.35, { damping: 12 });
      smileTranslateY.value = withSpring(2, { damping: 12 });
      
      eyeScaleY.value = withSpring(0.15, { damping: 15 });
      eyeScaleX.value = withSpring(1.2, { damping: 15 });

      setTimeout(() => {
        splashScale.value = withTiming(0.9, { duration: 400 });
        blobHeight.value = withTiming(height * 2, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) });
        blobBorder.value = withTiming(0, { duration: 600 });
        setTimeout(() => {
          splashOpacity.value = withTiming(0, { duration: 200 });
          setTimeout(() => {
            setStep(0);
          }, 200);
        }, 500);
      }, 700);

    } else if (step === 0 && nameCompleted) {
      Keyboard.dismiss();
      setStep(1);
    } else if (step === 1) {
      Keyboard.dismiss();
      setStep(2);
    }
  };

  const handleFinish = async () => {
    addPoints(totalPossiblePoints, "Bônus de boas-vindas!");
    await AsyncStorage.setItem("beep_onboarded", "true");
    await AsyncStorage.setItem("beep_user_name", name.trim());
    await AsyncStorage.setItem("beep_interests", JSON.stringify(selectedInterests));
    await AsyncStorage.setItem("beep_theme", isDark ? "dark" : "light");
    
    if (avatarUri) {
      await AsyncStorage.setItem("beep_avatar", avatarUri);
    } else {
      const avatar = await AsyncStorage.getItem("beep_avatar");
      if (!avatar) {
        await AsyncStorage.setItem("beep_avatar", `https://api.dicebear.com/7.x/notionists/png?seed=${encodeURIComponent(name.trim())}&backgroundColor=ffcc00`);
      }
    }

    router.replace('/(tabs)');
  };

  const handlePickAvatar = async () => {
    Alert.alert(
      "Sua foto",
      "Escolha como quer adicionar sua foto",
      [
        {
          text: "Tirar foto agora",
          onPress: async () => {
            const { granted } = await ImagePicker.requestCameraPermissionsAsync();
            if (granted) {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
              });
              if (!result.canceled) {
                setAvatarUri(result.assets[0].assets ? result.assets[0].uri : result.assets[0].uri);
              }
            } else {
              Alert.alert("Permissão negada", "Precisamos de acesso à câmera.");
            }
          }
        },
        {
          text: "Escolher da Galeria",
          onPress: async () => {
            const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (granted) {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
              });
              if (!result.canceled) {
                setAvatarUri(result.assets[0].uri);
              }
            } else {
              Alert.alert("Permissão negada", "Precisamos de acesso à galeria.");
            }
          }
        },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const skipOnboarding = async () => {
    await AsyncStorage.setItem("beep_onboarded", "true");
    router.replace('/(tabs)');
  };

  const allInterests = [...DEFAULT_INTERESTS, ...customInterests.map(c => ({ id: c, label: c, emoji: "✨" }))];

  const BOTTOM_BAR_HEIGHT = 14 + 56 + Math.max(insets.bottom, 16);

  // Animated styles
  const splashContainerStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
    zIndex: step === -1 ? 50 : -1,
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'hsl(0, 0%, 8%)',
  }));

  const splashContentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: splashScale.value }],
    flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingBottom: height * 0.55
  }));

  const blobStyle = useAnimatedStyle(() => ({
    height: blobHeight.value,
    borderTopLeftRadius: blobBorder.value,
    borderTopRightRadius: blobBorder.value,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  }));

  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: faceScale.value },
      { rotate: `${faceRotate.value}deg` },
      { translateY: faceTranslateY.value }
    ],
    position: 'absolute', top: '20%', left: 0, right: 0, alignItems: 'center',
  }));

  const smileAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: smileScaleX.value },
      { scaleY: smileScaleY.value },
      { translateY: smileTranslateY.value }
    ]
  }));

  const eyeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: eyeScaleX.value },
      { scaleY: eyeScaleY.value }
    ]
  }));

  const rootBg = (step === -1 || step === 0 || step === 1 || step === 2)
    ? 'hsl(45, 100%, 50%)'
    : (isDark ? '#0a0a0a' : '#f5f5f5');
  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      
      {/* Background layer for Onboarding */}
      {(step === -1 || step === 0 || step === 1 || step === 2) && (
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient colors={['hsl(45, 100%, 50%)', 'hsl(40, 90%, 45%)']} style={StyleSheet.absoluteFill} />
          <Hexagons />
        </View>
      )}

      {/* Skip button */}
      {step !== -1 && (
        <TouchableOpacity
          onPress={skipOnboarding}
          style={{ position: 'absolute', top: insets.top + 8, right: 20, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
        >
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'hsla(30, 50%, 15%, 0.7)' }}>Pular →</Text>
        </TouchableOpacity>
      )}

      {/* ──── Progress Bar Header ──── */}
      {step >= 0 && (
        <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 8, zIndex: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Image 
                source={{ uri: beepLogoBase64 }} 
                style={{ width: 36, height: 36 }} 
                resizeMode="contain" 
              />
              <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -1.5, color: 'hsl(30, 50%, 15%)', includeFontPadding: false }}>beep</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'hsla(30, 50%, 15%, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <Trophy size={14} color="hsl(30, 50%, 15%)" />
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: "hsl(30, 50%, 15%)" }}>{totalPossiblePoints} pts</Text>
            </View>
          </View>

          <Animated.View style={[{ flexDirection: 'row', gap: 8 }, stepPulseStyle]}>
            {[0, 1, 2].map((s) => {
              const isActiveSegment = s === step;
              const fillWidth = s < step ? '100%' : s === step ? (s === 0 ? (nameCompleted ? '100%' : '30%') : s === 1 ? `${Math.min(selectedInterests.length * 14, 100)}%` : '100%') : '0%';
              return (
                <View key={s} style={{ flex: 1, height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: 'hsla(30, 50%, 15%, 0.15)' }}>
                  <View
                    style={{
                      height: '100%', borderRadius: 6,
                      backgroundColor: 'hsla(30, 50%, 15%, 0.7)',
                      width: fillWidth,
                    }}
                  />
                </View>
              );
            })}
          </Animated.View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: 'hsla(30, 50%, 15%, 0.6)' }}>
              {step === 0 ? "Seu nome" : step === 1 ? "Seus gostos" : "Pronto!"}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: 'hsla(30, 50%, 15%, 0.8)' }}>
              {step + 1}/3
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ──── Splash Screen ──── */}
      <Animated.View style={splashContainerStyle} pointerEvents={step === -1 ? "auto" : "none"}>
        <LinearGradient colors={['hsl(0, 0%, 8%)', 'hsl(0, 0%, 5%)']} style={StyleSheet.absoluteFill} />
        
        <Animated.View style={splashContentStyle}>
          {Array.from({ length: 12 }).map((_, i) => <Particle key={`p-${i}`} i={i} />)}
          
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <LogoGlow />
            {[0, 1, 2].map((i) => <Ring key={`r-${i}`} i={i} />)}
            <Animated.Image entering={FadeIn.delay(200).springify()} source={{ uri: beepLogoBase64 }} style={{ width: 140, height: 140, zIndex: 10 }} resizeMode="contain" />
          </View>
        </Animated.View>

        {/* Yellow Blob */}
        <AnimatedLinearGradient colors={['hsl(45, 100%, 50%)', 'hsl(40, 90%, 45%)']} style={blobStyle}>
          <Animated.View style={faceStyle}>
            <View style={{ flexDirection: 'row', gap: 50, marginBottom: 12 }}>
              {[0, 1].map((i) => (
                <Animated.View key={i} style={eyeAnimatedStyle}>
                  <Svg width="32" height="20" viewBox="0 0 24 16">
                    <Path d="M3 14 C8 2, 16 2, 21 14" stroke="hsl(30, 50%, 15%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  </Svg>
                </Animated.View>
              ))}
            </View>
            <Animated.View style={smileAnimatedStyle}>
              <Svg width="48" height="28" viewBox="0 0 36 20">
                <Path d="M5 6 C11 18, 25 18, 31 6" stroke="hsl(30, 50%, 15%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </Svg>
            </Animated.View>
          </Animated.View>

          {/* Bottom Actions */}
          <View style={{ position: 'absolute', bottom: Math.max(insets.bottom, 20) + 60, left: 32, right: 32, alignItems: 'center' }}>
            <View style={{ alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'hsla(30, 50%, 15%, 0.7)' }}>Escolha seu tema:</Text>
              <View style={{ flexDirection: 'row', backgroundColor: 'hsla(30, 50%, 15%, 0.12)', borderRadius: 16, padding: 4, gap: 4 }}>
                <Pressable onPress={() => { setColorScheme('light'); Haptics.impactAsync(); }} style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }, !isDark && { backgroundColor: 'hsla(0, 0%, 100%, 0.9)', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }]}>
                  <Sun size={16} color="hsl(30, 50%, 15%)" />
                  <Text style={{ color: 'hsl(30, 50%, 15%)', fontWeight: '700' }}>Light</Text>
                </Pressable>
                <Pressable onPress={() => { setColorScheme('dark'); Haptics.impactAsync(); }} style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }, isDark && { backgroundColor: 'hsla(0, 0%, 100%, 0.9)', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }]}>
                  <Moon size={16} color="hsl(30, 50%, 15%)" />
                  <Text style={{ color: 'hsl(30, 50%, 15%)', fontWeight: '700' }}>Dark</Text>
                </Pressable>
              </View>
            </View>
            <TouchableOpacity onPress={goNext} style={{ width: '100%', height: 56, borderRadius: 16, backgroundColor: 'hsl(30, 50%, 15%)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={{ color: 'hsl(45, 100%, 50%)', fontWeight: 'bold', fontSize: 16 }}>Começar 🐝</Text>
              <ChevronRight size={18} color="hsl(45, 100%, 50%)" />
            </TouchableOpacity>
          </View>
        </AnimatedLinearGradient>
      </Animated.View>

      {/* ──── Step 0: Name Input ──── */}
      {step === 0 && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.View entering={FadeIn.delay(300)} exiting={FadeOut} style={{ flex: 1, zIndex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ 
              flexGrow: 1, 
              justifyContent: 'center', 
              paddingHorizontal: 20, 
              paddingBottom: BOTTOM_BAR_HEIGHT + 20 
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={SlideInRight.springify().delay(400)} style={[{ alignSelf: 'center' }, avatarAnimatedStyle]}>
              <TouchableOpacity onPress={handlePickAvatar} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'hsla(30, 50%, 15%, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                ) : (
                  <User size={36} color="hsl(30, 50%, 15%)" />
                )}
                <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: 'hsl(30, 50%, 15%)', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'hsl(45, 100%, 50%)' }}>
                  <Plus size={14} color="hsl(45, 100%, 50%)" />
                </View>
              </TouchableOpacity>
            </Animated.View>
            <Animated.Text entering={SlideInRight.springify().delay(500)} style={[{ fontSize: 24, fontWeight: '800', textAlign: 'center', color: 'hsl(30, 50%, 15%)' }, titleAnimatedStyle]}>Qual é o seu nome?</Animated.Text>
            <Animated.Text entering={SlideInRight.springify().delay(600)} style={[{ fontSize: 14, textAlign: 'center', color: 'hsla(30, 50%, 15%, 0.7)' }, subtitleAnimatedStyle]}>Nos conte como podemos te chamar</Animated.Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', textAlign: 'center', color: 'hsla(30, 50%, 15%, 0.3)', marginTop: 8, marginBottom: 12 }}>v1.0.3 (B4)</Text>

              <Animated.View entering={FadeInDown.delay(500)}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16,
                  borderWidth: 2, borderColor: 'hsla(30, 50%, 15%, 0.3)',
                  paddingLeft: 20, paddingRight: 6, height: 56
                }}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Seu nome"
                    placeholderTextColor="hsla(30, 50%, 15%, 0.4)"
                    style={{
                      flex: 1, height: '100%',
                      color: 'hsl(30, 50%, 15%)', fontSize: 18, fontWeight: '600'
                    }}
                    autoFocus
                    onSubmitEditing={goNext}
                  />
                  {nameCompleted && (
                    <Animated.View entering={ZoomIn.duration(200)}>
                      <TouchableOpacity 
                        onPress={goNext} 
                        style={{ 
                          width: 44, height: 44, borderRadius: 12, 
                          backgroundColor: 'hsl(30, 50%, 15%)', 
                          justifyContent: 'center', alignItems: 'center' 
                        }}
                      >
                        <ChevronRight size={24} color="hsl(45, 100%, 50%)" />
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>
              </Animated.View>

            {nameCompleted && (
              <Animated.View entering={FadeIn}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                  <Sparkles size={14} color="hsl(30, 50%, 15%)" />
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'hsl(30, 50%, 15%)' }}>+{POINTS_NAME} pontos!</Text>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
        </KeyboardAvoidingView>
      )}

      {/* ──── Step 1: Interests ──── */}
      {step === 1 && (
        <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
          <Animated.Text entering={FadeIn.delay(100)} style={{ fontSize: 24, fontWeight: '800', color: 'hsl(30, 50%, 15%)', marginBottom: 4 }}>O que te interessa?</Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={{ fontSize: 14, color: 'hsla(30, 50%, 15%, 0.7)', marginBottom: 20 }}>
            Selecione seus gostos — cada um vale <Text style={{ fontWeight: 'bold', color: 'hsl(30, 50%, 15%)' }}>+{POINTS_PER_INTEREST} pts</Text>
          </Animated.Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: BOTTOM_BAR_HEIGHT + 20 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {allInterests.map((interest, i) => {
                const selected = selectedInterests.includes(interest.id);
                return (
                  <Animated.View key={interest.id} entering={FadeIn.delay(250 + i * 50).springify()}>
                    <TouchableOpacity
                      onPress={() => toggleInterest(interest.id)}
                      style={[{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        gap: 6, 
                        paddingHorizontal: 14, 
                        paddingVertical: 10, 
                        borderRadius: 12, 
                        borderWidth: 2 
                      }, selected ? { 
                        backgroundColor: 'hsla(30, 50%, 15%, 0.12)', 
                        borderColor: 'hsl(30, 50%, 15%)' 
                      } : { 
                        backgroundColor: 'rgba(255,255,255,0.8)', 
                        borderColor: 'hsla(30, 50%, 15%, 0.15)' 
                      }]}
                    >
                      <Text>{interest.emoji}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: 'hsl(30, 50%, 15%)' }}>
                        {interest.label}
                      </Text>
                      {selected && <Check size={14} color="hsl(30, 50%, 15%)" style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            <Animated.View entering={FadeIn.delay(600)} style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              <TextInput
                value={newInterest}
                onChangeText={setNewInterest}
                placeholder="Adicionar outro gosto..."
                style={{ 
                  flex: 1, 
                  height: 44, 
                  borderRadius: 12, 
                  borderWidth: 2, 
                  borderColor: 'hsla(30, 50%, 15%, 0.3)', 
                  backgroundColor: 'rgba(255,255,255,0.8)', 
                  paddingHorizontal: 12, 
                  fontSize: 14, 
                  color: 'hsl(30, 50%, 15%)' 
                }}
                placeholderTextColor="hsla(30, 50%, 15%, 0.4)"
                onSubmitEditing={addCustomInterest}
              />
              <TouchableOpacity 
                onPress={addCustomInterest} 
                style={{ 
                  height: 44, 
                  width: 44, 
                  borderRadius: 12, 
                  backgroundColor: 'rgba(255,255,255,0.8)', 
                  borderWidth: 2, 
                  borderColor: 'hsla(30, 50%, 15%, 0.3)', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <Plus size={18} color="hsl(30, 50%, 15%)" />
              </TouchableOpacity>
            </Animated.View>

            {selectedInterests.length > 0 && (
              <Animated.View entering={FadeIn} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
                <Sparkles size={14} color="hsl(30, 50%, 15%)" />
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'hsl(30, 50%, 15%)' }}>+{interestPoints} pontos acumulados!</Text>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* ──── Step 2: Welcome ──── */}
      {step === 2 && (
        <Animated.View entering={SlideInRight} style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View entering={FadeIn.springify().delay(100)} style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: 'hsla(30, 50%, 15%, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Sparkles size={44} color="hsl(30, 50%, 15%)" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(300)} style={{ fontSize: 24, fontWeight: '800', color: 'hsl(30, 50%, 15%)', marginBottom: 8, textAlign: 'center' }}>Bem-vindo, {name}! 🐝✨ (OTA OK!)</Animated.Text>
          <Animated.Text entering={FadeIn.delay(400)} style={{ fontSize: 14, color: 'hsla(30, 50%, 15%, 0.7)', textAlign: 'center', marginBottom: 12 }}>Você já começou com</Animated.Text>

          <Animated.View entering={FadeIn.springify().delay(500)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'hsla(30, 50%, 15%, 0.12)', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12, marginBottom: 32 }}>
            <Trophy size={22} color="hsl(30, 50%, 15%)" />
            <Text style={{ fontSize: 30, fontWeight: '900', color: 'hsl(30, 50%, 15%)' }}>{totalPossiblePoints}</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'hsla(30, 50%, 15%, 0.7)' }}>pontos</Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(700)} style={{ width: '100%' }}>
            <TouchableOpacity onPress={handleFinish} style={{ width: '100%', height: 56, borderRadius: 16, backgroundColor: 'hsl(30, 50%, 15%)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={{ color: 'hsl(45, 100%, 50%)', fontWeight: 'bold', fontSize: 16 }}>Começar a usar o BEEP</Text>
              <ChevronRight size={18} color="hsl(45, 100%, 50%)" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}

      {/* ──── Bottom Action Buttons ──── */}
      {step === 1 && (
        <Animated.View entering={FadeInUp.delay(600)} style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 20) + 40, paddingTop: 12 }}>
          <TouchableOpacity
            onPress={() => { Keyboard.dismiss(); setStep(step - 1); }}
            style={{ flex: 1, height: 56, borderRadius: 16, borderWidth: 2, borderColor: 'hsl(30, 50%, 15%)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: 'hsl(30, 50%, 15%)', fontWeight: 'bold' }}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            style={{
              flex: 1, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'hsl(30, 50%, 15%)',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'hsl(45, 100%, 50%)', marginRight: 8 }}>
              Próximo
            </Text>
            <ChevronRight size={20} color="hsl(45, 100%, 50%)" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}
