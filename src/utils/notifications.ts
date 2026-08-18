import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  // Evita o crash no Expo Go
  if (Constants.appOwnership === 'expo') {
    console.log('Push notifications ignorados no Expo Go para evitar exce��o nativa.');
    return null;
  }

  let token;
  try {
    const Notifications = await import('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } catch (error) {
    console.log('Erro de notifica��o ignorado:', error);
  }

  return token;
}
