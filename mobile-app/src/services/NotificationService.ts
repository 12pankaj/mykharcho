import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { UserService } from '../api/apiService';

export async function registerForPushNotificationsAsync() {
    let token;

    try {
        if (Platform.OS === 'android') {
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }

        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
            console.log('Failed to get push permission!');
            return;
        }

        token = await messaging().getToken();

        // Send FCM token to our backend
        if (token) {
            try {
                await UserService.savePushToken(token);
                console.log('FCM token saved to backend:', token);
            } catch (err) {
                console.error('Failed to save push token to backend:', err);
            }
        }
    } catch (e) {
        console.error('Failed to configure Firebase messaging', e);
    }

    return token;
}
