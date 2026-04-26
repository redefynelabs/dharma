// lib/subscription.ts
// Utility functions for RevenueCat subscription management

import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesError,
  PurchasesStoreProduct,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import Config from '@/constants/config';

/**
 * Check if a user has Dharma AI Premium entitlement
 * @param customerInfo - RevenueCat CustomerInfo object
 * @returns boolean indicating premium status
 */
export function hasDharmaAIPremium(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo?.entitlements?.active) return false;
  return !!(
    customerInfo.entitlements.active[Config.PREMIUM_ENTITLEMENT_ID] ||
    customerInfo.entitlements.active[Config.PRO_ENTITLEMENT_ID]
  );
}

/**
 * Get the premium entitlement details
 * @param customerInfo - RevenueCat CustomerInfo object
 * @returns The entitlement object or null
 */
export function getPremiumEntitlement(customerInfo: CustomerInfo | null) {
  if (!customerInfo?.entitlements?.active) return null;
  return (
    customerInfo.entitlements.active[Config.PREMIUM_ENTITLEMENT_ID] ||
    customerInfo.entitlements.active[Config.PRO_ENTITLEMENT_ID] ||
    null
  );
}

/**
 * Check if subscription will renew
 * @param customerInfo - RevenueCat CustomerInfo object
 * @returns boolean indicating if subscription will auto-renew
 */
export function willRenew(customerInfo: CustomerInfo | null): boolean {
  const entitlement = getPremiumEntitlement(customerInfo);
  if (!entitlement) return false;
  return entitlement.willRenew ?? false;
}

/**
 * Get expiration date of premium subscription
 * @param customerInfo - RevenueCat CustomerInfo object
 * @returns Date object or null if not premium/lifetime
 */
export function getExpirationDate(customerInfo: CustomerInfo | null): Date | null {
  const entitlement = getPremiumEntitlement(customerInfo);
  if (!entitlement?.expirationDate) return null;
  return new Date(entitlement.expirationDate);
}

/**
 * Check if subscription is in trial period
 * @param customerInfo - RevenueCat CustomerInfo object
 * @returns boolean indicating trial status
 */
export function isInTrialPeriod(customerInfo: CustomerInfo | null): boolean {
  const entitlement = getPremiumEntitlement(customerInfo);
  if (!entitlement) return false;
  return entitlement.periodType === 'TRIAL';
}

/**
 * Get the offering with a specific identifier
 * @param offerings - RevenueCat offerings object
 * @param identifier - Offering identifier (defaults to 'default')
 * @returns PurchasesOffering or null
 */
export async function getOffering(identifier: string = Config.DEFAULT_OFFERING_ID): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.all[identifier] || offerings.current || null;
  } catch (error) {
    console.warn('[subscription] Failed to get offering:', error);
    return null;
  }
}

/**
 * Get monthly package from offering
 * @param offering - RevenueCat offering object
 * @returns PurchasesPackage or null
 */
export function getMonthlyPackage(offering: PurchasesOffering | null): PurchasesPackage | null {
  if (!offering?.availablePackages) return null;
  return (
    offering.availablePackages.find(
      (pkg) => pkg.product.identifier === Config.PRO_MONTHLY_PRODUCT_ID
    ) || offering.availablePackages[0] ||
    null
  );
}

/**
 * Get yearly package from offering
 * @param offering - RevenueCat offering object
 * @returns PurchasesPackage or null
 */
export function getYearlyPackage(offering: PurchasesOffering | null): PurchasesPackage | null {
  if (!offering?.availablePackages) return null;
  return (
    offering.availablePackages.find(
      (pkg) => pkg.product.identifier === Config.PRO_YEARLY_PRODUCT_ID
    ) || null
  );
}

/**
 * Format price with period for display
 * @param product - RevenueCat product object
 * @returns Formatted price string (e.g., "$9.99/month")
 */
export function formatPriceWithPeriod(product: PurchasesStoreProduct): string {
  const period = product.subscriptionPeriod;
  if (!period) return product.priceString;

  // Format period nicely
  let periodLabel = '';
  if (period === 'P1M') periodLabel = '/month';
  else if (period === 'P1Y') periodLabel = '/year';
  else if (period === 'P1W') periodLabel = '/week';
  else if (period.startsWith('P')) {
    // Parse ISO 8601 duration (simplified)
    const match = period.match(/P(\d+)([MYWD])/);
    if (match) {
      const [, num, unit] = match;
      const unitMap: Record<string, string> = { M: 'month', Y: 'year', W: 'week', D: 'day' };
      periodLabel = `/${num}${unitMap[unit] || unit.toLowerCase()}`;
    }
  }

  return `${product.priceString}${periodLabel}`;
}

/**
 * Calculate savings percentage between monthly and yearly
 * @param monthly - Monthly package
 * @param yearly - Yearly package
 * @returns Percentage saved or null
 */
export function calculateSavings(
  monthly: PurchasesPackage | null,
  yearly: PurchasesPackage | null
): number | null {
  if (!monthly?.product?.price || !yearly?.product?.price) return null;

  const monthlyPrice = monthly.product.price;
  const yearlyPrice = yearly.product.price;
  const equivalentMonthly = yearlyPrice / 12;

  const savings = ((monthlyPrice - equivalentMonthly) / monthlyPrice) * 100;
  return Math.round(savings);
}

/**
 * Present RevenueCat Paywall (modal presentation)
 * @param offering - Optional specific offering to display
 * @returns Promise with paywall result
 */
export async function presentPaywallModal(
  offering?: PurchasesOffering
): Promise<{ purchased: boolean; restored: boolean; cancelled: boolean; result: PAYWALL_RESULT }> {
  try {
    const result = offering
      ? await RevenueCatUI.presentPaywall({ offering })
      : await RevenueCatUI.presentPaywall();

    return {
      purchased: result === PAYWALL_RESULT.PURCHASED,
      restored: result === PAYWALL_RESULT.RESTORED,
      cancelled: result === PAYWALL_RESULT.CANCELLED,
      result,
    };
  } catch (error) {
    console.warn('[subscription] Paywall presentation failed:', error);
    return {
      purchased: false,
      restored: false,
      cancelled: false,
      result: PAYWALL_RESULT.ERROR,
    };
  }
}

/**
 * Present paywall only if user doesn't have entitlement
 * @param entitlementId - Required entitlement identifier
 * @returns Promise with paywall result
 */
export async function presentPaywallIfNeeded(
  entitlementId: string = Config.PREMIUM_ENTITLEMENT_ID
): Promise<{ presented: boolean; purchased: boolean; restored: boolean; result: PAYWALL_RESULT | null }> {
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: entitlementId,
    });

    return {
      presented: true,
      purchased: result === PAYWALL_RESULT.PURCHASED,
      restored: result === PAYWALL_RESULT.RESTORED,
      result,
    };
  } catch (error) {
    // If user already has entitlement, the promise might reject or return specific result
    console.warn('[subscription] Conditional paywall failed:', error);
    return {
      presented: false,
      purchased: false,
      restored: false,
      result: null,
    };
  }
}

/**
 * Handle purchase with comprehensive error handling
 * @param pkg - Package to purchase
 * @returns Object with success status and error details
 */
export async function purchasePackageWithHandling(pkg: PurchasesPackage): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  userCancelled: boolean;
  error?: PurchasesError;
}> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo, userCancelled: false };
  } catch (error) {
    const purchasesError = error as PurchasesError;
    const errorCode = (purchasesError as any)?.code as number;
    const errorMessage = purchasesError?.message?.toLowerCase() || '';

    // Error code constants from react-native-purchases
    const USER_CANCELLED = 1;
    const STORE_PROBLEM = 2;
    const PURCHASE_NOT_ALLOWED = 3;
    const PURCHASE_INVALID = 4;
    const PRODUCT_ALREADY_PURCHASED = 7;

    // User cancelled
    if (errorCode === USER_CANCELLED || errorMessage.includes('cancelled') || errorMessage.includes('canceled')) {
      return { success: false, userCancelled: true };
    }

    // Store-specific errors
    switch (errorCode) {
      case STORE_PROBLEM:
        return {
          success: false,
          userCancelled: false,
          error: { ...purchasesError, message: 'Store problem. Please try again later.' } as PurchasesError,
        };
      case PURCHASE_NOT_ALLOWED:
        return {
          success: false,
          userCancelled: false,
          error: { ...purchasesError, message: 'Purchase not allowed on this device.' } as PurchasesError,
        };
      case PURCHASE_INVALID:
        return {
          success: false,
          userCancelled: false,
          error: { ...purchasesError, message: 'Invalid purchase. Product may not exist.' } as PurchasesError,
        };
      case PRODUCT_ALREADY_PURCHASED:
        return {
          success: false,
          userCancelled: false,
          error: { ...purchasesError, message: 'You already own this subscription.' } as PurchasesError,
        };
      default:
        return {
          success: false,
          userCancelled: false,
          error: purchasesError,
        };
    }
  }
}

/**
 * Restore purchases with error handling
 * @returns Object with success status and entitlement info
 */
export async function restorePurchasesWithHandling(): Promise<{
  success: boolean;
  hasEntitlement: boolean;
  error?: string;
}> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const hasEntitlement = hasDharmaAIPremium(customerInfo);

    return { success: true, hasEntitlement };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to restore purchases';
    console.warn('[subscription] Restore failed:', error);
    return { success: false, hasEntitlement: false, error: errorMessage };
  }
}

/**
 * Get customer info with caching
 * Uses the SDK's built-in caching, but provides a cleaner interface
 */
export async function getCustomerInfo(): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return { success: true, customerInfo };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get customer info';
    return { success: false, error: errorMessage };
  }
}

/**
 * Sync subscription status with backend
 * Call this after successful purchase or restore
 */
export async function syncSubscriptionWithBackend(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Import dynamically to avoid circular dependencies
    const { subscriptionApi } = await import('@/lib/api');
    const res = await subscriptionApi.sync();
    return { success: res.data?.data != null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Sync failed';
    console.warn('[subscription] Backend sync failed:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Log RevenueCat customer ID for debugging
 */
export async function logCustomerInfo(): Promise<void> {
  if (!__DEV__) return;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    console.log('[subscription] Customer Info:', {
      id: customerInfo.originalAppUserId,
      entitlements: Object.keys(customerInfo.entitlements.active),
      managementUrl: customerInfo.managementURL,
    });
  } catch (error) {
    console.warn('[subscription] Failed to log customer info:', error);
  }
}

/**
 * Check if subscriptions are supported on current device
 * (Useful for App Clips or restricted devices)
 */
export async function areSubscriptionsSupported(): Promise<boolean> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current != null || Object.keys(offerings.all).length > 0;
  } catch {
    return false;
  }
}

// Export all as default object for convenience
export default {
  hasDharmaAIPremium,
  getPremiumEntitlement,
  willRenew,
  getExpirationDate,
  isInTrialPeriod,
  getOffering,
  getMonthlyPackage,
  getYearlyPackage,
  formatPriceWithPeriod,
  calculateSavings,
  presentPaywallModal,
  presentPaywallIfNeeded,
  purchasePackageWithHandling,
  restorePurchasesWithHandling,
  getCustomerInfo,
  syncSubscriptionWithBackend,
  logCustomerInfo,
  areSubscriptionsSupported,
};
