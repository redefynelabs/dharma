import Constants, { ExecutionEnvironment } from 'expo-constants';
import Config from '@/constants/config';

// Native Google Sign-In only works in dev builds and production — not Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let configured = false;

export function useGoogleSignIn() {
  async function signIn(): Promise<string | null> {
    if (isExpoGo) {
      const err = new Error('Google Sign-In requires a development build. Use email sign-in instead.');
      (err as any).code = 'EXPO_GO';
      throw err;
    }

    // Lazy require avoids the TurboModuleRegistry crash at module-load time in Expo Go
    const { GoogleSignin, isSuccessResponse } =
      require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');

    if (!configured) {
      GoogleSignin.configure({
        webClientId: Config.GOOGLE_WEB_CLIENT_ID,
        iosClientId: Config.GOOGLE_IOS_CLIENT_ID,
        offlineAccess: false,
      });
      configured = true;
    }

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Sign out any cached session so the account picker always appears
    await GoogleSignin.signOut().catch(() => {});
    const response = await GoogleSignin.signIn();
    if (__DEV__) console.log('[GoogleSignIn] response:', JSON.stringify(response));
    if (isSuccessResponse(response)) {
      return response.data.idToken ?? null;
    }
    return null; // user cancelled
  }

  return { signIn };
}
