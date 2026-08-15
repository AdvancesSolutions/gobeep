import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  // Evita o crash no Expo Go
  if (Constants.appOwnership === 'expo') {
    console.log('Push notifications ignorados no Expo Go para evitar exceção nativa.');
    return null;
  }

  let token;
  try {
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
    console.log('Erro de notificação ignorado:', error);
  }

  return token;
}
