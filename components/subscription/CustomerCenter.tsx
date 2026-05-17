// components/subscription/CustomerCenter.tsx
// RevenueCat Customer Center for subscription management
// Note: Customer Center is available on RevenueCat Pro and Enterprise plans

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/hooks/useSubscription';
import { getExpirationDate, willRenew, isInTrialPeriod, restorePurchasesWithHandling } from '@/lib/subscription';
import { useThemeColors, ThemeColors, Fonts, FontSize, Spacing, Radius } from '@/theme';

/**
 * Customer Center Screen
 *
 * Provides subscription management features:
 * - View current subscription status
 * - Restore purchases
 * - Cancel subscription (opens App Store/Play Store)
 * - Request refund (iOS only)
 *
 * Note: RevenueCat's native Customer Center UI is available on Pro/Enterprise plans.
 * This is a custom implementation that provides similar functionality.
 */
export default function CustomerCenter() {
  const router = useRouter();
  const {
    customerInfo,
    isPremium,
    refreshCustomerInfo,
    presentPaywall,
  } = useSubscription();
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get subscription details
  const expirationDate = customerInfo ? getExpirationDate(customerInfo) : null;
  const renews = customerInfo ? willRenew(customerInfo) : false;
  const inTrial = customerInfo ? isInTrialPeriod(customerInfo) : false;

  // Handle restore purchases
  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const result = await restorePurchasesWithHandling();

      if (result.success && result.hasEntitlement) {
        Alert.alert(
          'Purchases Restored',
          'Your Premium subscription has been restored successfully.',
          [{ text: 'OK', onPress: () => refreshCustomerInfo() }]
        );
      } else if (result.success && !result.hasEntitlement) {
        Alert.alert(
          'No Purchases Found',
          'No previous Premium subscription was found on this account.'
        );
      } else {
        Alert.alert('Restore Failed', result.error || 'Failed to restore purchases');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // Open subscription management (App Store / Play Store)
  const handleManageSubscription = async () => {
    if (!customerInfo?.managementURL) {
      Alert.alert(
        'Cannot Open Settings',
        'Unable to open subscription management at this time.'
      );
      return;
    }

    // Open the management URL
    // This opens the App Store subscription management on iOS
    // or Play Store subscriptions on Android
    try {
      const { Linking } = await import('react-native');
      await Linking.openURL(customerInfo.managementURL);
    } catch {
      Alert.alert('Error', 'Could not open subscription settings');
    }
  };

  // Handle upgrade to premium
  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const { purchased } = await presentPaywall();
      if (purchased) {
        Alert.alert(
          'Welcome to Premium!',
          'Your Premium subscription is now active.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Request refund (iOS only through Apple's system)
  const handleRequestRefund = async () => {
    Alert.alert(
      'Request Refund',
      'To request a refund, please visit reportaproblem.apple.com or contact Google Play support.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Website',
          onPress: async () => {
            const { Linking } = await import('react-native');
            await Linking.openURL('https://reportaproblem.apple.com');
          },
        },
      ]
    );
  };

  // Render subscription status card
  const renderStatusCard = () => {
    if (isPremium) {
      return (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>✦ PREMIUM ACTIVE</Text>
            </View>
          </View>

          {inTrial && (
            <Text style={styles.statusDetail}>
              You're currently in a free trial period.
            </Text>
          )}

          {expirationDate && (
            <Text style={styles.statusDetail}>
              {renews
                ? `Renews on ${expirationDate.toLocaleDateString()}`
                : `Expires on ${expirationDate.toLocaleDateString()}`}
            </Text>
          )}

          {!renews && expirationDate && (
            <Text style={styles.warningText}>
              Your subscription will not renew.
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={[styles.statusCard, styles.inactiveCard]}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusBadge, styles.inactiveBadge]}>
            <Text style={styles.inactiveBadgeText}>FREE PLAN</Text>
          </View>
        </View>
        <Text style={styles.statusDetail}>
          Upgrade to Premium for unlimited AI conversations and full scripture access.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text0} />
        </TouchableOpacity>
        <Text style={styles.title}>Subscription</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Status Card */}
        {renderStatusCard()}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>

          {/* Restore Purchases */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="refresh" size={20} color={colors.gold} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Restore Purchases</Text>
              <Text style={styles.actionSubtitle}>
                Recover your previous Premium subscription
              </Text>
            </View>
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.text2} />
            )}
          </TouchableOpacity>

          {/* Manage Subscription */}
          {isPremium && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleManageSubscription}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="settings-outline" size={20} color={colors.gold} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Manage Subscription</Text>
                <Text style={styles.actionSubtitle}>
                  Cancel or change your subscription
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.text2} />
            </TouchableOpacity>
          )}

          {/* Upgrade (if not premium) */}
          {!isPremium && (
            <TouchableOpacity
              style={[styles.actionButton, styles.upgradeButton]}
              onPress={handleUpgrade}
              disabled={isLoading}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="star" size={20} color={colors.gold} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, styles.upgradeTitle]}>
                  Upgrade to Premium
                </Text>
                <Text style={styles.actionSubtitle}>
                  Unlock unlimited access
                </Text>
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.gold} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.gold} />
              )}
            </TouchableOpacity>
          )}

          {/* Request Refund */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRequestRefund}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="cash-outline" size={20} color={colors.gold} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Request Refund</Text>
              <Text style={styles.actionSubtitle}>
                Contact Apple or Google for refunds
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.text2} />
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            Having trouble with your subscription?{' '}
            <Text
              style={styles.helpLink}
              onPress={async () => {
                const { Linking } = await import('react-native');
                await Linking.openURL('mailto:support@dharmaai.app');
              }}
            >
              Contact Support
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function useStyles(c: ThemeColors) {
  return useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderBottomWidth: 0.5,
      borderBottomColor: c.goldBorder,
    },
    backButton: {
      padding: Spacing.sm,
      marginLeft: -Spacing.sm,
    },
    title: {
      fontFamily: Fonts.cinzel,
      fontSize: FontSize.lg,
      color: c.text0,
      letterSpacing: 1,
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: Spacing.xl,
    },
    statusCard: {
      backgroundColor: c.bg2,
      borderWidth: 0.5,
      borderColor: c.gold,
      borderRadius: Radius.lg,
      padding: Spacing.xl,
      marginBottom: Spacing.xxl,
    },
    inactiveCard: {
      borderColor: c.goldBorder,
    },
    statusHeader: {
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    statusBadge: {
      backgroundColor: 'rgba(200,137,42,0.15)',
      borderRadius: Radius.full,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    statusBadgeText: {
      fontFamily: Fonts.cinzel,
      fontSize: 11,
      letterSpacing: 2,
      color: c.gold,
    },
    inactiveBadge: {
      backgroundColor: c.bg3,
    },
    inactiveBadgeText: {
      fontFamily: Fonts.cinzel,
      fontSize: 11,
      letterSpacing: 2,
      color: c.text2,
    },
    statusDetail: {
      fontFamily: Fonts.garamond,
      fontSize: FontSize.md,
      color: c.text1,
      textAlign: 'center',
      lineHeight: 24,
    },
    warningText: {
      fontFamily: Fonts.garamond,
      fontSize: FontSize.sm,
      color: '#E8A83A',
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
    actionsSection: {
      marginBottom: Spacing.xxl,
    },
    sectionTitle: {
      fontFamily: Fonts.cinzel,
      fontSize: FontSize.md,
      color: c.text0,
      letterSpacing: 0.5,
      marginBottom: Spacing.md,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bg2,
      borderWidth: 0.5,
      borderColor: c.goldBorder,
      borderRadius: Radius.md,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    upgradeButton: {
      borderColor: c.gold,
      backgroundColor: c.bg3,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(200,137,42,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    actionContent: {
      flex: 1,
    },
    actionTitle: {
      fontFamily: Fonts.cinzel,
      fontSize: FontSize.md,
      color: c.text0,
      marginBottom: 2,
    },
    upgradeTitle: {
      color: c.gold,
    },
    actionSubtitle: {
      fontFamily: Fonts.garamond,
      fontSize: FontSize.sm,
      color: c.text2,
    },
    helpSection: {
      alignItems: 'center',
    },
    helpText: {
      fontFamily: Fonts.garamond,
      fontSize: FontSize.sm,
      color: c.text2,
      textAlign: 'center',
    },
    helpLink: {
      color: c.gold,
      textDecorationLine: 'underline',
    },
  }), [c]);
}
