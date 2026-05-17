import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { GoldButton, OutlineButton } from '@/components/UI';
import { useThemeColors, ThemeColors, Fonts, FontSize, Spacing } from '@/theme';
import { useAuthStore } from '@/store/authStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const setGuest = useAuthStore((s) => s.setGuest);

  function handleContinueAsGuest() {
    setGuest(true);
    router.replace('/(app)/(tabs)');
  }

  return (
    <View style={styles.container}>
      {/* Background rings */}
      {[200, 290, 380].map((s, i) => (
        <View key={i} style={[styles.ring, { width: s, height: s, borderRadius: s / 2, top: '8%', left: '50%', marginLeft: -s / 2, opacity: 0.04 }]} />
      ))}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroOm}>ॐ</Text>
          <Text style={styles.heroTitle}>DHARMA</Text>
          <Text style={styles.heroSubtitle}>SACRED SCRIPTURE READER</Text>
          <View style={styles.goldDivider} />
        </View>

        <View style={styles.actions}>
          <GoldButton label="BEGIN THE JOURNEY" onPress={() => router.push('/(auth)/sign-up')} />
          <OutlineButton
            label="SIGN IN WITH EMAIL"
            onPress={() => router.push('/(auth)/sign-in')}
            style={{ marginTop: 12 }}
          />
          <TouchableOpacity onPress={handleContinueAsGuest} style={styles.guestBtn} activeOpacity={0.7}>
            <Text style={styles.guestBtnText}>CONTINUE AS GUEST</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.quote}>
          {"\"Change is the law of the universe. You can be a \n millionaire or a pauper in an instant\""}
        </Text>
      </ScrollView>
    </View>
  );
}

function useStyles(c: ThemeColors) {
  return useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg0 },
    ring: { position: 'absolute', borderWidth: 0.5, borderColor: c.gold },
    content: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: 40 },
    hero: { alignItems: 'center', paddingTop: 80, paddingBottom: 56 },
    heroOm: {
      fontFamily: Fonts.cinzel, fontSize: 72, color: c.gold,
      textShadowColor: c.goldGlow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 40,
    },
    heroTitle: {
      fontFamily: Fonts.cinzelBold, fontSize: 40, letterSpacing: 9,
      color: c.text0, marginTop: 20, marginBottom: 6,
    },
    heroSubtitle: {
      fontFamily: Fonts.garamond, fontSize: FontSize.xs,
      letterSpacing: 4, color: c.goldDim, textTransform: 'uppercase',
    },
    goldDivider: { width: 60, height: 1, backgroundColor: c.gold, marginTop: 22, opacity: 0.5 },
    actions: { gap: 0 },
    guestBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
    guestBtnText: {
      fontFamily: Fonts.cinzel, fontSize: FontSize.xs,
      color: c.text2, letterSpacing: 2,
    },
    quote: {
      fontFamily: Fonts.garamondItalic, fontSize: FontSize.md, color: c.text2,
      textAlign: 'center', marginTop: 44, letterSpacing: 0.5, lineHeight: 24,
    },
  }), [c]);
}
