import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Config from '@/constants/config';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
  // Do NOT pass redirectUri — the Google provider auto-generates the correct
  // native redirect URI from iosClientId:
  //   com.googleusercontent.apps.{CLIENT_ID}:/
  // Passing makeRedirectUri() overrides this and produces exp:// in Expo Go,
  // which Google OAuth rejects (non-HTTPS).
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: Config.GOOGLE_IOS_CLIENT_ID,
    androidClientId: Config.GOOGLE_ANDROID_CLIENT_ID,
    webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  });

  if (__DEV__) {
    console.log('[Google OAuth] redirectUri:', request?.redirectUri);
  }

  return { request, response, promptAsync, redirectUri: request?.redirectUri ?? '' };
}
