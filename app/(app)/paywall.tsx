// app/(app)/paywall.tsx
// Premium subscription paywall screen
// Supports both custom UI and RevenueCat's native Paywall

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSubscription } from '@/hooks/useSubscription';
import { GoldButton, GhostButton } from '@/components/UI';
import { Colors, Fonts, FontSize, Spacing, Radius } from '@/theme';

// Feature list for premium
const FEATURES = [
  'Unlimited AI wisdom conversations',
  'Full scripture access across all three texts',
  'Sanskrit transliteration & word meanings',
  'Offline reading — all three scriptures',
  'Personalised daily verse & reminders',
  'Priority response speed, ad-free',
];

// Toggle between custom UI and RevenueCat native paywall
const USE_REVENUECAT_PAYWALL = false; // Set to true to use RevenueCat's native paywall

export default function PaywallScreen() {
  const router = useRouter();
  const {
    packages,
    products,
    isLoadingOfferings,
    isPurchasing,
    error: offeringsError,
    purchasePackage,
    restorePurchases,
    presentPaywall,
    loadOfferings,
  } = useSubscription();

  const [selectedPackage, setSelectedPackage] = useState(packages[0] || null);
  const [restoring, setRestoring] = useState(false);

  // Update selected package when packages load
  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      // Prefer yearly package
      const yearly = products.yearly?.package;
      setSelectedPackage(yearly || packages[0]);
    }
  }, [packages, products, selectedPackage]);

  // Handle RevenueCat native paywall
  const handleNativePaywall = async () => {
    try {
      const { purchased } = await presentPaywall();

      if (purchased) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '✦ Welcome, Devotee!',
          'Your Premium subscription is now active. Unlimited wisdom awaits.',
          [{ text: 'Continue', onPress: () => router.back() }]
        );
      }
    } catch (err) {
      console.warn('Paywall presentation failed:', err);
    }
  };

  // Handle purchase with custom UI
  const handlePurchase = async () => {
    if (USE_REVENUECAT_PAYWALL) {
      await handleNativePaywall();
      return;
    }

    if (!selectedPackage) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { success, error } = await purchasePackage(selectedPackage);

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '✦ Welcome, Devotee!',
          'Your Premium subscription is now active. Unlimited wisdom awaits.',
          [{ text: 'Continue', onPress: () => router.back() }]
        );
      } else if (error) {
        Alert.alert('Purchase Failed', error.message);
      }
    } catch (err: any) {
      Alert.alert('Purchase Failed', err.message);
    }
  };

  // Handle restore purchases
  const handleRestore = async () => {
    try {
      setRestoring(true);
      const { success, isPremium } = await restorePurchases();

      if (success && isPremium) {
        Alert.alert(
          'Purchases Restored',
          'Your Premium subscription has been restored.',
          [{ text: 'Continue', onPress: () => router.back() }]
        );
      } else if (success && !isPremium) {
        Alert.alert('No Purchases Found', 'No previous Premium subscription was found.');
      } else {
        Alert.alert('Restore Failed', 'Failed to restore purchases. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err.message);
    } finally {
      setRestoring(false);
    }
  };

  // Check if a package is yearly
  const isYearly = (pkg: typeof selectedPackage) => {
    if (!pkg) return false;
    return pkg.product.identifier.includes('year');
  };

  // Render RevenueCat native paywall option
  if (USE_REVENUECAT_PAYWALL) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.nativePaywallContainer}>
          <Text style={styles.nativePaywallText}>
            Loading Premium Paywall...
          </Text>
          <ActivityIndicator color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Dismiss */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.closeBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {/* Background rings */}
      {[180, 280, 380].map((s, i) => (
        <View
          key={i}
          style={[
            styles.bgRing,
            {
              width: s,
              height: s,
              borderRadius: s / 2,
              top: '-5%',
              opacity: 0.03 + i * 0.01,
            },
          ]}
        />
      ))}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Badge */}
        <View style={styles.badge}>
          <LinearGradient
            colors={['rgba(200,137,42,0.15)', 'rgba(232,168,58,0.07)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badgeGrad}
          >
            <Text style={styles.badgeText}>✦ DHARMA PREMIUM</Text>
          </LinearGradient>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>Unlock the Complete Dharma</Text>
        <Text style={styles.subHeadline}>
          Access all sacred scriptures and unlimited AI wisdom guidance.
        </Text>

        {/* Features */}
        <View style={styles.featuresBlock}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        {isLoadingOfferings ? (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.xxl }}>
            <ActivityIndicator color={Colors.gold} />
          </View>
        ) : packages.length === 0 ? (
          <View style={styles.noPlans}>
            <Text style={styles.noPlansText}>
              Plans unavailable. Check your connection and try again.
            </Text>
            {__DEV__ && offeringsError && (
              <Text style={styles.noPlansError}>{offeringsError.message}</Text>
            )}
            <TouchableOpacity
              onPress={loadOfferings}
              style={styles.retryBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.plansBlock}>
            {packages.map((pkg) => {
              const selected = selectedPackage?.identifier === pkg.identifier;
              const yearly = isYearly(pkg);

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  onPress={() => {
                    setSelectedPackage(pkg);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                  style={[styles.planCard, selected && styles.planCardSelected]}
                >
                  {yearly && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>Best Value</Text>
                    </View>
                  )}
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planLabel}>
                      {yearly ? 'Annual' : 'Monthly'}
                    </Text>
                    {yearly && (
                      <Text style={styles.planNote}>Save ~40% vs monthly</Text>
                    )}
                  </View>
                  <View style={styles.priceBlock}>
                    <Text
                      style={[
                        styles.planPrice,
                        selected && styles.planPriceActive,
                      ]}
                    >
                      {pkg.product.priceString}
                    </Text>
                    <Text style={styles.planPeriod}>
                      {yearly ? '/ year' : '/ month'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* CTA */}
        <GoldButton
          label={isPurchasing ? '' : 'BEGIN PREMIUM JOURNEY'}
          onPress={handlePurchase}
          loading={isPurchasing}
        />

        <GhostButton
          label="Continue with Free"
          onPress={() => router.back()}
          style={{ marginTop: Spacing.md }}
          textStyle={{
            textAlign: 'center',
            fontSize: FontSize.sm,
            letterSpacing: 0.5,
          }}
        />

        <TouchableOpacity
          onPress={handleRestore}
          disabled={restoring}
          style={{ alignItems: 'center', paddingVertical: 8 }}
        >
          {restoring ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : (
            <Text style={styles.restoreText}>Restore previous purchase</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.legal}>
          Subscriptions auto-renew unless cancelled 24 hours before renewal.{' '}
          {'\n'}Manage in your App Store / Play Store settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  closeBtn: {
    position: 'absolute',
    top: 54,
    left: Spacing.xl,
    zIndex: 10,
  },
  closeBtnText: {
    fontFamily: Fonts.garamond,
    fontSize: 20,
    color: Colors.text2,
    lineHeight: 22,
  },
  bgRing: {
    position: 'absolute',
    left: '50%',
    marginLeft: -190,
    borderWidth: 0.5,
    borderColor: Colors.gold,
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 64,
    paddingBottom: 40,
    gap: Spacing.xl,
  },
  badge: {
    alignItems: 'center',
  },
  badgeGrad: {
    borderWidth: 0.5,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  badgeText: {
    fontFamily: Fonts.cinzel,
    fontSize: 11,
    letterSpacing: 2.5,
    color: Colors.gold,
  },
  headline: {
    fontFamily: Fonts.cinzelBold,
    fontSize: 32,
    color: Colors.text0,
    letterSpacing: 1,
    lineHeight: 42,
    textAlign: 'center',
  },
  subHeadline: {
    fontFamily: Fonts.garamond,
    fontSize: FontSize.base,
    color: Colors.text1,
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresBlock: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(200,137,42,0.12)',
    borderWidth: 0.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkMark: {
    color: Colors.gold,
    fontSize: 11,
    lineHeight: 13,
  },
  featureText: {
    fontFamily: Fonts.garamond,
    fontSize: FontSize.md,
    color: Colors.text1,
    flex: 1,
    lineHeight: 22,
  },
  noPlans: {
    backgroundColor: Colors.bg2,
    borderWidth: 0.5,
    borderColor: Colors.goldBorder,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  noPlansText: {
    fontFamily: Fonts.garamond,
    fontSize: FontSize.sm,
    color: Colors.text2,
    textAlign: 'center',
  },
  noPlansError: {
    fontFamily: Fonts.garamond,
    fontSize: 11,
    color: Colors.danger,
    textAlign: 'center',
    marginTop: 6,
  },
  retryBtn: {
    marginTop: Spacing.md,
    borderWidth: 0.5,
    borderColor: Colors.goldBorder,
    borderRadius: Radius.full,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryBtnText: {
    fontFamily: Fonts.cinzel,
    fontSize: 10,
    color: Colors.gold,
    letterSpacing: 1,
  },
  plansBlock: {
    gap: 10,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.bg2,
    borderWidth: 0.5,
    borderColor: Colors.goldBorder,
    borderRadius: Radius.md,
    padding: 18,
  },
  planCardSelected: {
    borderColor: Colors.gold,
    backgroundColor: Colors.bg3,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  bestValueText: {
    fontFamily: Fonts.cinzel,
    fontSize: 10,
    color: Colors.bg0,
    letterSpacing: 0.5,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: Colors.gold,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gold,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontFamily: Fonts.cinzel,
    fontSize: 14,
    color: Colors.text0,
    letterSpacing: 0.8,
  },
  planNote: {
    fontFamily: Fonts.garamond,
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  planPrice: {
    fontFamily: Fonts.cinzel,
    fontSize: 22,
    color: Colors.text0,
  },
  planPriceActive: {
    color: Colors.gold,
  },
  planPeriod: {
    fontFamily: Fonts.garamond,
    fontSize: 12,
    color: Colors.text2,
  },
  restoreText: {
    fontFamily: Fonts.garamond,
    fontSize: FontSize.sm,
    color: Colors.text2,
    letterSpacing: 0.5,
  },
  legal: {
    fontFamily: Fonts.garamond,
    fontSize: 12,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 19,
  },
  nativePaywallContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg0,
  },
  nativePaywallText: {
    fontFamily: Fonts.garamond,
    fontSize: FontSize.md,
    color: Colors.text1,
    marginBottom: Spacing.md,
  },
});
