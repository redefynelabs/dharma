// providers/PurchasesProvider.tsx
import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { Platform } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Config from '@/constants/config';
import Purchases, { CustomerInfo } from 'react-native-purchases';

function isPlaceholderKey(key: string): boolean {
  // Valid keys: iOS starts with 'appl_' + real chars, Android with 'goog_' + real chars
  // Catch missing, placeholder-named, or incomplete keys
  if (!key) return true;
  if (key === 'appl_YOUR_IOS_KEY' || key === 'goog_YOUR_ANDROID_KEY') return true;
  if (!key.startsWith('appl_') && !key.startsWith('goog_')) return true;
  // The key must have actual content after the prefix (not just dots or whitespace)
  const suffix = key.replace(/^(appl_|goog_)/, '');
  if (!suffix || /^[.\s]+$/.test(suffix)) return true;
  return false;
}

// Context type for sharing CustomerInfo across the app
interface PurchasesContextType {
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  isConfigured: boolean;
  refreshCustomerInfo: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextType>({
  customerInfo: null,
  isLoading: true,
  isConfigured: false,
  refreshCustomerInfo: async () => {},
});

export const usePurchasesContext = () => useContext(PurchasesContext);

export default function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // Get the appropriate API key based on platform
  const apiKey = Platform.OS === 'ios'
    ? Config.REVENUECAT_IOS_KEY
    : Config.REVENUECAT_ANDROID_KEY;

  // Function to refresh customer info
  const refreshCustomerInfo = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      if (__DEV__) {
        console.warn('[PurchasesProvider] Failed to refresh customer info:', error);
      }
    }
  }, [isConfigured]);

  useEffect(() => {
    // Check if API key is configured
    if (isPlaceholderKey(apiKey)) {
      if (__DEV__) {
        console.warn(
          `[PurchasesProvider] RevenueCat API key is missing or invalid (got: "${apiKey}").\n` +
          'Set EXPO_PUBLIC_REVENUECAT_IOS_KEY (appl_xxxxx) / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY (goog_xxxxx)\n' +
          'in your .env file, then rebuild the app (env vars are baked in at build time).'
        );
      }
      setIsLoading(false);
      return;
    }

    let unsubscribeAuth: (() => void) | null = null;

    async function setupPurchases() {
      try {
        // Enable debug logging in development
        if (__DEV__) {
          Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
          console.log(`[PurchasesProvider] Configuring with key: ${apiKey.substring(0, 8)}...`);
        }

        // Configure Purchases with API key
        Purchases.configure({ apiKey });
        setIsConfigured(true);
        if (__DEV__) console.log('[PurchasesProvider] SDK configured successfully');

        // Get initial customer info
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        // Set up CustomerInfo listener for real-time updates
        // This fires whenever purchases are made, restored, or subscriptions change
        Purchases.addCustomerInfoUpdateListener((info) => {
          if (__DEV__) {
            console.log('[PurchasesProvider] CustomerInfo updated:', {
              entitlements: info.entitlements.active,
            });
          }
          setCustomerInfo(info);
        });

        // Set up auth state listener to link Purchases with Firebase user
        unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
          try {
            if (user) {
              // Log in to RevenueCat with Firebase user ID
              // This links purchases to the user's account
              const { customerInfo: linkedInfo } = await Purchases.logIn(user.uid);
              setCustomerInfo(linkedInfo);
            } else {
              // Log out from RevenueCat when user signs out
              const loggedOutInfo = await Purchases.logOut();
              setCustomerInfo(loggedOutInfo);
            }
          } catch (error) {
            // Non-fatal: auth state changes shouldn't crash the app
            if (__DEV__) {
              console.warn('[PurchasesProvider] Auth sync error:', error);
            }
          }
        });

      } catch (error) {
        // RevenueCat native module not linked (Expo Go / bare workflow without setup)
        if (__DEV__) {
          console.warn('[PurchasesProvider] RevenueCat setup failed:', error);
        }
      } finally {
        setIsLoading(false);
      }
    }

    setupPurchases();

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
      // Note: RevenueCat doesn't have a removeListener method in React Native
      // The SDK automatically handles cleanup when the app is closed
    };
  }, [apiKey]);

  const value: PurchasesContextType = {
    customerInfo,
    isLoading,
    isConfigured,
    refreshCustomerInfo,
  };

  return (
    <PurchasesContext.Provider value={value}>
      {children}
    </PurchasesContext.Provider>
  );
}
