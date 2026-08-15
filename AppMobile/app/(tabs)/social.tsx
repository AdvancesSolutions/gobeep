import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { PageHeader } from '../../components/PageHeader';
import { Heart, MessageCircle, Share2, Radio, Tv } from 'lucide-react-native';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';

const hostIp = Constants.expoConfig?.hostUri?.split(':')[0] || '10.0.2.2';
const socket = io(`http://${hostIp}:3001`);

export interface FeedPost {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  action: 'watching' | 'listening';
  target: string;
  station: string;
  timestamp: Date;
  likes: number;
  comments: number;
  isLikedByMe: boolean;
  type: 'tv' | 'radio';
}

const INITIAL_FEED: FeedPost[] = [
  {
    id: '1',
    user: { name: 'Mariana S.', avatar: 'https://i.pravatar.cc/150?u=mariana' },
    action: 'watching',
    target: 'Jornal Nacional',
    station: 'TV Globo',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    likes: 12,
    comments: 2,
    isLikedByMe: false,
    type: 'tv'
  },
  {
    id: '2',
    user: { name: 'Lucas M.', avatar: 'https://i.pravatar.cc/150?u=lucas' },
    action: 'listening',
    target: 'Programa Pânico',
    station: 'Jovem Pan FM',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    likes: 5,
    comments: 0,
    isLikedByMe: true,
    type: 'radio'
  },
  {
    id: '3',
    user: { name: 'Beatriz A.', avatar: 'https://i.pravatar.cc/150?u=beatriz' },
    action: 'watching',
    target: 'Masterchef',
    station: 'Band',
    timestamp: new Date(Date.now() - 1000 * 60 * 22),
    likes: 31,
    comments: 7,
    isLikedByMe: false,
    type: 'tv'
  },
  {
    id: '4',
    user: { name: 'Diego R.', avatar: 'https://i.pravatar.cc/150?u=diego' },
    action: 'listening',
    target: 'Futebol AO Vivo',
    station: 'Rádio Bandeirantes',
    timestamp: new Date(Date.now() - 1000 * 60 * 38),
    likes: 18,
    comments: 4,
    isLikedByMe: false,
    type: 'radio'
  },
  {
    id: '5',
    user: { name: 'Camila F.', avatar: 'https://i.pravatar.cc/150?u=camila' },
    action: 'watching',
    target: 'Novela das 9',
    station: 'TV Globo',
    timestamp: new Date(Date.now() - 1000 * 60 * 51),
    likes: 44,
    comments: 12,
    isLikedByMe: true,
    type: 'tv'
  },
  {
    id: '6',
    user: { name: 'Rodrigo P.', avatar: 'https://i.pravatar.cc/150?u=rodrigo' },
    action: 'listening',
    target: 'Rock Clássico',
    station: '89 FM',
    timestamp: new Date(Date.now() - 1000 * 60 * 70),
    likes: 9,
    comments: 1,
    isLikedByMe: false,
    type: 'radio'
  },
  {
    id: '7',
    user: { name: 'Fernanda L.', avatar: 'https://i.pravatar.cc/150?u=fernanda' },
    action: 'watching',
    target: 'Documentário Netflix',
    station: 'TV Cultura',
    timestamp: new Date(Date.now() - 1000 * 60 * 95),
    likes: 27,
    comments: 3,
    isLikedByMe: false,
    type: 'tv'
  },
  {
    id: '8',
    user: { name: 'Gustavo T.', avatar: 'https://i.pravatar.cc/150?u=gustavo' },
    action: 'listening',
    target: 'Rádio Cidade FM',
    station: '98.5 FM',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    likes: 15,
    comments: 2,
    isLikedByMe: false,
    type: 'radio'
  }
];

export default function SocialFeedScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_FEED);

  useEffect(() => {
    socket.on('new_feed_post', (newPost: FeedPost) => {
      // Add a small delay/animation or directly update
      setPosts(prev => [newPost, ...prev]);
    });

    return () => {
      socket.off('new_feed_post');
    };
  }, []);

  const handleLike = (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLikedByMe ? post.likes - 1 : post.likes + 1,
          isLikedByMe: !post.isLikedByMe
        };
      }
      return post;
    }));
  };

  const renderPost = ({ item, index }: { item: FeedPost; index: number }) => {
    const Icon = item.type === 'tv' ? Tv : Radio;
    const accentColor = item.type === 'tv' ? '#3b82f6' : '#ffcc00';

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 100).springify()} 
        className="bg-card border-2 border-border rounded-3xl p-5 mb-4 shadow-lg"
        style={{ elevation: 4 }}
      >
        {/* User Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <Image source={{ uri: item.user.avatar }} className="w-10 h-10 rounded-full border border-border" />
            <View>
              <Text className="font-bold text-foreground text-sm">{item.user.name}</Text>
              <Text className="text-[10px] text-muted-foreground mt-0.5">
                {Math.round((Date.now() - new Date(item.timestamp).getTime()) / 60000)} min atrás
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="mb-4">
          <Text className="text-foreground text-sm">
            Está {item.action === 'watching' ? 'assistindo' : 'ouvindo'} <Text className="font-bold">{item.target}</Text> na {item.station}.
          </Text>
        </View>

        {/* Media / Rich Preview (Mock) */}
        <View className="w-full h-32 rounded-2xl bg-black/10 overflow-hidden mb-4 border border-border/50 items-center justify-center">
          <Icon size={40} color={accentColor} opacity={0.2} />
          <View className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex-row items-center gap-1.5">
             <Icon size={12} color={accentColor} />
             <Text className="text-white text-[10px] font-bold uppercase tracking-wider">{item.station}</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row items-center justify-between pt-3 border-t border-border">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={() => handleLike(item.id)} className="flex-row items-center gap-1.5 p-1">
              <Heart size={20} color={item.isLikedByMe ? '#ef4444' : '#888'} fill={item.isLikedByMe ? '#ef4444' : 'transparent'} />
              <Text className={`font-semibold text-xs ${item.isLikedByMe ? 'text-red-500' : 'text-muted-foreground'}`}>{item.likes}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-row items-center gap-1.5 p-1">
              <MessageCircle size={20} color="#888" />
              <Text className="font-semibold text-xs text-muted-foreground">{item.comments}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="p-1">
            <Share2 size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'hsl(0, 0%, 96%)' }} className="dark:bg-[#0a0a0a]">
      <PageHeader 
        title="Feed Social" 
        subtitle="O que seus amigos estão consumindo agora"
      />
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
