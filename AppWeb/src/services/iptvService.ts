export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
}

export interface PlaylistConfig {
  id: string;
  name: string;
  type: 'm3u' | 'xtream';
  url: string;
  username?: string;
  password?: string;
}

const STORAGE_KEY = '@beepapp_playlists';

export const getSavedPlaylists = (): PlaylistConfig[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Erro ao ler playlists salvas', e);
  }
  return [];
};

export const savePlaylist = (playlist: PlaylistConfig) => {
  const current = getSavedPlaylists();
  const updated = [...current.filter(p => p.id !== playlist.id), playlist];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const deletePlaylist = (id: string) => {
  const current = getSavedPlaylists();
  const updated = current.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const fetchChannelsFromPlaylist = async (config: PlaylistConfig): Promise<Channel[]> => {
  if (config.type === 'xtream') {
    return fetchXtreamChannels(config);
  } else {
    return fetchM3UChannels(config.url);
  }
};

const fetchXtreamChannels = async (config: PlaylistConfig): Promise<Channel[]> => {
  try {
    // A API do Xtream para canais ao vivo é /player_api.php?username=X&password=Y&action=get_live_streams
    const baseUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;
    const apiUrl = `${baseUrl}/player_api.php?username=${config.username}&password=${config.password}&action=get_live_streams`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: String(item.stream_id),
      name: item.name,
      logo: item.stream_icon || 'https://via.placeholder.com/300x150?text=TV',
      url: `${baseUrl}/live/${config.username}/${config.password}/${item.stream_id}.m3u8`,
      group: item.category_name || 'Ao Vivo'
    }));
  } catch (error) {
    console.error('Erro no Xtream:', error);
    return [];
  }
};

export const fetchM3UChannels = async (url: string = 'https://iptv-org.github.io/iptv/countries/br.m3u'): Promise<Channel[]> => {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return parseM3U(text);
  } catch (error) {
    console.error('Erro ao baixar lista M3U:', error);
    return [
      { id: '1', name: 'SBT', logo: 'https://upload.wikimedia.org/wikipedia/pt/b/b6/Logotipo_do_SBT.svg', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', group: 'Nacional' },
      { id: '2', name: 'Record', logo: 'https://upload.wikimedia.org/wikipedia/pt/2/2b/Logotipo_da_RecordTV.png', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', group: 'Nacional' },
      { id: '3', name: 'RedeTV!', logo: 'https://upload.wikimedia.org/wikipedia/pt/5/50/Logotipo_da_RedeTV%21.png', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', group: 'Nacional' },
      { id: '4', name: 'CazéTV (YouTube)', logo: 'https://yt3.googleusercontent.com/ytc/AIdro_kX44Y8g4bZ9f5Gq5yR7N8OQ3H2h18A=s900-c-k-c0x00ffffff-no-rj', url: 'https://www.youtube.com/watch?v=1', group: 'Esportes' },
    ];
  }
};

const parseM3U = (m3u: string): Channel[] => {
  const lines = m3u.split('\n');
  const channels: Channel[] = [];
  
  let currentChannel: Partial<Channel> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const commaIndex = line.lastIndexOf(',');
      const name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Canal Desconhecido';
      
      currentChannel = {
        id: Math.random().toString(36).substring(7),
        name: name,
        logo: logoMatch ? logoMatch[1] : 'https://via.placeholder.com/300x150?text=TV',
        group: groupMatch ? groupMatch[1] : 'Outros',
      };
    } else if (line && !line.startsWith('#')) {
      currentChannel.url = line;
      channels.push(currentChannel as Channel);
      currentChannel = {};
    }
  }
  
  return channels;
};
