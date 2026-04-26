// hooks/useSubscription.ts
// Comprehensive hook for managing RevenueCat subscriptions and entitlements

import { useState, useEffect, useCallback, useMemo } from 'react';
import Purchases, {
  CustomerInfo,
  PurchasesError,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import Config from '@/constants/config';
import { usePurchasesContext } from '@/providers/PurchasesProvider';

// Subscription status enum
export enum SubscriptionStatus {
  LOADING = 'loading',
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  ERROR = 'error',
}

// Product type for simplified access
export interface Product {
  identifier: string;
  priceString: string;
  price: number;
  currencyCode: string;
  period: string;
  package: PurchasesPackage;
}

// Subscription state interface
export interface SubscriptionState {
  status: SubscriptionStatus;
  isPremium: boolean;
  customerInfo: CustomerInfo | null;
  error: Error | null;
}

// Hook return type
export interface UseSubscriptionReturn extends SubscriptionState {
  // Offering data
  offering: PurchasesOffering | null;
  packages: PurchasesPackage[];
  products: {
    monthly: Product | null;
    yearly: Product | null;
    all: Product[];
  };

  // Loading states
  isLoadingOfferings: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;

  // Actions
  refreshCustomerInfo: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: Error }>;
  restorePurchases: () => Promise<{ success: boolean; isPremium: boolean; error?: Error }>;
  presentPaywall: () => Promise<{ purchased: boolean; result: PAYWALL_RESULT }>;
  presentPaywallIfNeeded: () => Promise<{ purchased: boolean; result: PAYWALL_RESULT | null }>;
  loadOfferings: () => Promise<void>;
}

/**
 * Hook for managing RevenueCat subscriptions
 * Provides real-time entitlement checking, purchase methods, and paywall presentation
 */
export function useSubscription(): UseSubscriptionReturn {
  const { isConfigured } = usePurchasesContext();

  // State
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check if user has premium entitlement
  const isPremium = useMemo((): boolean => {
    if (!customerInfo?.entitlements?.active) return false;
    return !!(
      customerInfo.entitlements.active[Config.PREMIUM_ENTITLEMENT_ID] ||
      customerInfo.entitlements.active[Config.PRO_ENTITLEMENT_ID]
    );
  }, [customerInfo]);

  // Derived state
  const status = useMemo((): SubscriptionStatus => {
    if (isLoadingOfferings && !customerInfo) return SubscriptionStatus.LOADING;
    if (error) return SubscriptionStatus.ERROR;
    if (isPremium) return SubscriptionStatus.ACTIVE;
    return SubscriptionStatus.INACTIVE;
  }, [isLoadingOfferings, customerInfo, error, isPremium]);

  // Process packages into simplified products
  const products = useMemo(() => {
    const packages = offering?.availablePackages ?? [];
    const all: Product[] = [];
    let monthly: Product | null = null;
    let yearly: Product | null = null;

    for (const pkg of packages) {
      const product: Product = {
        identifier: pkg.product.identifier,
        priceString: pkg.product.priceString,
        price: pkg.product.price,
        currencyCode: pkg.product.currencyCode,
        period: pkg.product.subscriptionPeriod || 'unknown',
        package: pkg,
      };

      all.push(product);

      // Categorize by identifier
      if (product.identifier === Config.PRO_MONTHLY_PRODUCT_ID) {
        monthly = product;
      } else if (product.identifier === Config.PRO_YEARLY_PRODUCT_ID) {
        yearly = product;
      }
    }

    return { monthly, yearly, all };
  }, [offering]);

  // Refresh customer info from RevenueCat
  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh customer info');
      setError(error);
      throw error;
    }
  }, []);

  // Load offerings from RevenueCat
  const loadOfferings = useCallback(async () => {
    setIsLoadingOfferings(true);
    setError(null);
    try {
      const offerings = await Purchases.getOfferings();

      if (__DEV__) {
        console.log('[useSubscription] Offerings fetched:', {
          current: offerings.current?.identifier ?? 'none',
          all: Object.keys(offerings.all),
          packages: offerings.current?.availablePackages?.map(p => p.product.identifier) ?? [],
        });
      }

      // Use current offering, then first available, then null
      const currentOffering = offerings.current ?? offerings.all[Object.keys(offerings.all)[0]] ?? null;

      if (!currentOffering && __DEV__) {
        console.warn(
          '[useSubscription] No offerings found. Make sure:\n' +
          '  1. Products exist in Play Store / App Store Connect\n' +
          '  2. Products are added in RevenueCat dashboard\n' +
          '  3. An Offering is created and set as Current\n' +
          '  4. Packages are attached to that Offering'
        );
      }

      setOffering(currentOffering);
      await refreshCustomerInfo();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load offerings');
      setError(error);
      if (__DEV__) {
        console.warn('[useSubscription] Failed to load offerings:', err);
      }
    } finally {
      setIsLoadingOfferings(false);
    }
  }, [refreshCustomerInfo]); // stable — no isConfigured here

  // Purchase a specific package
  const purchasePackage = useCallback(async (
    pkg: PurchasesPackage
  ): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: Error }> => {
    setIsPurchasing(true);
    try {
      const { customerInfo: newCustomerInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(newCustomerInfo);
      return { success: true, customerInfo: newCustomerInfo };
    } catch (err) {
      // User cancelled is not an error
      if (err && typeof err === 'object' && 'userCancelled' in err && (err as PurchasesError).userCancelled) {
        return { success: false };
      }

      // Check if user cancelled (using error message or code)
      const purchasesError = err as PurchasesError;
      const errorCode = (purchasesError as any)?.code;
      const isUserCancelled =
        errorCode === 1 || // UserCancelledError code
        purchasesError?.message?.toLowerCase().includes('cancelled') ||
        purchasesError?.message?.toLowerCase().includes('canceled');

      if (isUserCancelled) {
        return { success: false };
      }

      const error = err instanceof Error ? err : new Error('Purchase failed');
      if (__DEV__) {
        console.warn('[useSubscription] Purchase failed:', err);
      }
      return { success: false, error };
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // Restore previous purchases
  const restorePurchases = useCallback(async (): Promise<{
    success: boolean;
    isPremium: boolean;
    error?: Error;
  }> => {
    setIsRestoring(true);
    try {
      const newCustomerInfo = await Purchases.restorePurchases();
      setCustomerInfo(newCustomerInfo);

      const hasEntitlement = !!(
        newCustomerInfo.entitlements.active[Config.PREMIUM_ENTITLEMENT_ID] ||
        newCustomerInfo.entitlements.active[Config.PRO_ENTITLEMENT_ID]
      );

      return { success: true, isPremium: hasEntitlement };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Restore failed');
      if (__DEV__) {
        console.warn('[useSubscription] Restore failed:', err);
      }
      return { success: false, isPremium: false, error };
    } finally {
      setIsRestoring(false);
    }
  }, []);

  // Present RevenueCat Paywall (modal)
  const presentPaywall = useCallback(async (): Promise<{
    purchased: boolean;
    result: PAYWALL_RESULT;
  }> => {
    try {
      const result = await RevenueCatUI.presentPaywall();

      // Refresh customer info after paywall dismissal
      await refreshCustomerInfo();

      const purchased = result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
      return { purchased, result };
    } catch (err) {
      if (__DEV__) {
        console.warn('[useSubscription] Paywall presentation failed:', err);
      }
      return { purchased: false, result: PAYWALL_RESULT.ERROR };
    }
  }, [refreshCustomerInfo]);

  // Present RevenueCat Paywall only if needed (no entitlement)
  const presentPaywallIfNeeded = useCallback(async (): Promise<{
    purchased: boolean;
    result: PAYWALL_RESULT | null;
  }> => {
    // If already premium, don't show paywall
    if (isPremium) {
      return { purchased: true, result: null };
    }

    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: Config.PREMIUM_ENTITLEMENT_ID,
      });

      // Refresh customer info after paywall dismissal
      await refreshCustomerInfo();

      const purchased = result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
      return { purchased, result };
    } catch (err) {
      if (__DEV__) {
        console.warn('[useSubscription] Conditional paywall failed:', err);
      }
      return { purchased: false, result: PAYWALL_RESULT.ERROR };
    }
  }, [isPremium, refreshCustomerInfo]);

  // Load offerings once the SDK is ready — both deps are intentional and stable
  useEffect(() => {
    if (isConfigured) {
      loadOfferings();
    } else {
      setIsLoadingOfferings(false);
    }
  }, [isConfigured, loadOfferings]);

  return {
    // State
    status,
    isPremium,
    customerInfo,
    error,

    // Offerings
    offering,
    packages: offering?.availablePackages ?? [],
    products,

    // Loading states
    isLoadingOfferings,
    isPurchasing,
    isRestoring,

    // Actions
    refreshCustomerInfo,
    purchasePackage,
    restorePurchases,
    presentPaywall,
    presentPaywallIfNeeded,
    loadOfferings,
  };
}

export default useSubscription;
