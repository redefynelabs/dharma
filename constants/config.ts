// constants/config.ts
//
// PRODUCTION SETUP:
//   Set EXPO_PUBLIC_API_BASE_URL in your .env (or CI/CD environment) to your
//   production server URL before building. Expo replaces process.env.EXPO_PUBLIC_*
//   at build time so the value is baked into the bundle.
//
// DEVELOPMENT:
//   Set EXPO_PUBLIC_API_BASE_URL in .env.local to your Mac's LAN IP so
//   physical devices on the same Wi-Fi can reach the dev server.
//   Run `ifconfig | grep "inet "` to find your LAN IP.

const Config = {
  // Backend API — reads from build-time env variable with LAN-IP dev fallback.
  API_BASE_URL: (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.213.218.252:3000/api/v1') as string,

  // Google Sign-In OAuth Client IDs
  // Web client ID: Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration
  GOOGLE_WEB_CLIENT_ID: '866683342547-k5qmqimi8ocad1sdp9rbkk4bmnu0v0uj.apps.googleusercontent.com',
  GOOGLE_IOS_CLIENT_ID: '866683342547-qhau404fi58rdo9bdaaqjoehki80873v.apps.googleusercontent.com',
  GOOGLE_ANDROID_CLIENT_ID: '866683342547-q64qkupem525hn2fhhrpdj5i53ccbr41.apps.googleusercontent.com',

  // RevenueCat
  // iOS key: RevenueCat Dashboard → Project → Apps → iOS → API key (starts with appl_)
  // Android key: RevenueCat Dashboard → Project → Apps → Android → API key (starts with goog_)
  // Set EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY in .env
  REVENUECAT_IOS_KEY: (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? 'appl_YOUR_IOS_KEY') as string,
  REVENUECAT_ANDROID_KEY: (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? 'goog_YOUR_ANDROID_KEY') as string,

  // Subscription product IDs (must match RevenueCat dashboard and App Store / Play Store)
  // These should match the product identifiers in your RevenueCat offerings
  PRO_MONTHLY_PRODUCT_ID: 'monthly',
  PRO_YEARLY_PRODUCT_ID: 'yearly',

  // Entitlement ID for Dharma AI Premium
  // This is the entitlement identifier configured in RevenueCat dashboard
  PREMIUM_ENTITLEMENT_ID: 'Dharma AI Premium',
  PRO_ENTITLEMENT_ID: 'pro', // Legacy fallback

  // Offering identifiers
  DEFAULT_OFFERING_ID: 'default',
} as const;

export default Config;
