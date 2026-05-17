// app/(app)/permissions.tsx
// Shown once on first launch after sign-in.
// Requests notifications + photo library, then routes to the main app.

import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as MediaLibrary from 'expo-media-library';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors, ThemeColors, Fonts, FontSize, Spacing, Radius } from '@/theme';

const PERMISSIONS_KEY = 'dharma_permissions_done';

type PermStatus = 'idle' | 'granted' | 'denied';

const ITEMS = [
  {
    key: 'notifications' as const,
    sym: '◎',
    title: 'Daily Verse',
    body: 'Receive a sacred verse each morning to begin your day with wisdom.',
  },
  {
    key: 'photos' as const,
    sym: '◫',
    title: 'Photo Library',
    body: 'Save beautifully formatted verse cards to your gallery to share with others.',
  },
];

export default function PermissionsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [notifications, setNotifications] = useState<PermStatus>('idle');
  const [photos, setPhotos] = useState<PermStatus>('idle');

  async function requestNotifications() {
    if (!Device.isDevice) { setNotifications('denied'); return; }
    const { status } = await Notifications.requestPermissionsAsync();
    if (Platform.OS === 'android' && status === 'granted') {
      await Notifications.setNotificationChannelAsync('daily_verse', {
        name: 'Daily Verse',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C4A747',
      });
    }
    setNotifications(status === 'granted' ? 'granted' : 'denied');
  }

  async function requestPhotos() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setPhotos(status === 'granted' ? 'granted' : 'denied');
  }

  async function handleContinue() {
    await AsyncStorage.setItem(PERMISSIONS_KEY, '1');
    router.replace('/(app)/(tabs)');
  }

  const allAnswered = notifications !== 'idle' && photos !== 'idle';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.sym}>ॐ</Text>
          <Text style={styles.title}>Before you begin</Text>
          <Text style={styles.subtitle}>
            Dharma works best with a few permissions. You can change these anytime in Settings.
          </Text>
        </View>

        {/* ── Permission cards ── */}
        <View style={styles.cards}>
          {ITEMS.map((item) => {
            const status = item.key === 'notifications' ? notifications : photos;
            const request = item.key === 'notifications' ? requestNotifications : requestPhotos;
            const granted = status === 'granted';
            const denied  = status === 'denied';

            return (
              <View key={item.key} style={styles.card}>
                <View style={[styles.iconBox, granted && styles.iconBoxGranted]}>
                  <Text style={[styles.iconSym, { color: granted ? colors.gold : colors.text1 }]}>
                    {granted ? '✓' : item.sym}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.body}</Text>
                </View>

                {status === 'idle' ? (
                  <TouchableOpacity style={styles.allowBtn} onPress={request} activeOpacity={0.75}>
                    <Text style={styles.allowBtnText}>Allow</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.statusPill, denied && styles.statusPillDenied]}>
                    <Text style={[styles.statusText, denied && styles.statusTextDenied]}>
                      {granted ? 'Granted' : 'Skipped'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Skip hint ── */}
        {!allAnswered && (
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.6} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}

        {/* ── Continue ── */}
        {allAnswered && (
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.continueBtnText}>ENTER DHARMA</Text>
          </TouchableOpacity>
        )}

      </View>
    </SafeAreaView>
  );
}

function useStyles(c: ThemeColors) {
  return useMemo(() => StyleSheet.create({
    safe:      { flex: 1, backgroundColor: c.bg0 },
    container: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center', gap: 36 },

    // Header
    header:   { alignItems: 'center', gap: 12 },
    sym: {
      fontFamily: Fonts.cinzel, fontSize: 48, color: c.gold,
      textShadowColor: c.goldGlow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 24,
      marginBottom: 4,
    },
    title: {
      fontFamily: Fonts.cinzel, fontSize: 20,
      color: c.text0, letterSpacing: 1.5, textAlign: 'center',
    },
    subtitle: {
      fontFamily: Fonts.garamond, fontSize: FontSize.base,
      color: c.text2, textAlign: 'center', lineHeight: 24, maxWidth: 300,
    },

    // Cards
    cards: { gap: 12 },
    card: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: c.bg2,
      borderWidth: 0.5, borderColor: `${c.gold}1A`,
      borderRadius: Radius.lg, padding: 16,
    },
    iconBox: {
      width: 44, height: 44, borderRadius: 12,
      borderWidth: 0.5, borderColor: `${c.gold}30`,
      backgroundColor: c.bg3,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    iconBoxGranted: {
      borderColor: `${c.gold}60`,
      backgroundColor: `${c.gold}10`,
    },
    iconSym: { fontFamily: Fonts.cinzel, fontSize: 18 },
    cardBody: { flex: 1, gap: 3 },
    cardTitle: {
      fontFamily: Fonts.cinzel, fontSize: FontSize.sm,
      color: c.text0, letterSpacing: 0.3,
    },
    cardDesc: {
      fontFamily: Fonts.garamond, fontSize: 12,
      color: c.text2, lineHeight: 18,
    },

    // Allow button
    allowBtn: {
      borderWidth: 0.5, borderColor: `${c.gold}55`,
      borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 7,
      backgroundColor: `${c.gold}10`,
    },
    allowBtnText: {
      fontFamily: Fonts.cinzel, fontSize: 10,
      color: c.gold, letterSpacing: 1,
    },

    // Status pills
    statusPill: {
      borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5,
      backgroundColor: `${c.gold}10`, borderWidth: 0.5, borderColor: `${c.gold}30`,
    },
    statusPillDenied: {
      backgroundColor: 'transparent', borderColor: `${c.gold}18`,
    },
    statusText: {
      fontFamily: Fonts.cinzel, fontSize: 9,
      color: c.gold, letterSpacing: 1,
    },
    statusTextDenied: { color: c.text2 },

    // Skip
    skipBtn:  { alignItems: 'center', paddingVertical: 4 },
    skipText: {
      fontFamily: Fonts.garamond, fontSize: FontSize.sm,
      color: c.text2, textDecorationLine: 'underline',
    },

    // Continue
    continueBtn: {
      backgroundColor: c.gold, borderRadius: Radius.md,
      paddingVertical: 15, alignItems: 'center',
    },
    continueBtnText: {
      fontFamily: Fonts.cinzelBold, fontSize: 13,
      color: c.bg0, letterSpacing: 2.5,
    },
  }), [c]);
}
