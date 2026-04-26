// constants/config.ts
// Fill these in with your actual values

const Config = {
  // Backend API
  API_BASE_URL: __DEV__
    ? 'http://localhost:3000/api/v1'        // local dev
    : 'https://your-api.com/api/v1',        // production

  // Google Sign-In
  GOOGLE_WEB_CLIENT_ID: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',

  // RevenueCat
  REVENUECAT_IOS_KEY: 'appl_YOUR_IOS_KEY',
  REVENUECAT_ANDROID_KEY: 'goog_YOUR_ANDROID_KEY',

  // Subscription product IDs (must match RevenueCat dashboard)
  PRO_MONTHLY_PRODUCT_ID: 'dharma_pro_monthly',
  PRO_YEARLY_PRODUCT_ID: 'dharma_pro_yearly',
  PRO_ENTITLEMENT_ID: 'pro',
} as const;

export default Config;