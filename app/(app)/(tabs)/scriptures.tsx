import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Topbar } from '@/components/UI';
import { Colors, Fonts, FontSize, Spacing, Radius } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');
// 9:16 cover images — show as full-width portrait cards
const CARD_W = SCREEN_W - Spacing.xl * 2;
const CARD_H = CARD_W * (16 / 9);

const SCRIPTURES = [
  {
    id:       'gita',
    cover:    require('@/assets/bhagavad_gita.png'),
    sym:      'ॐ',
    name:     'Bhagavad Gita',
    subtitle: 'The Song of God',
    epigraph: 'On the eve of war, a prince lays down his bow. What follows is a dialogue with the divine that has guided every seeker since.',
    stats:    '18 Chapters · 701 Verses',
    accent:   Colors.gitaAccent,
    shadow:   'rgba(200,137,42,0.35)',
    overlay:  ['transparent', 'rgba(10,8,6,0.55)', 'rgba(8,6,4,0.93)'] as const,
  },
  {
    id:       'ramayana',
    cover:    require('@/assets/ramayana.png'),
    sym:      '◈',
    name:     'Valmiki Ramayana',
    subtitle: 'The Journey of Rama',
    epigraph: "A king's son walks into exile. Across seven books, through forest and ocean and war, he shows what it means to live righteously.",
    stats:    '7 Kandas · 23,402 Verses',
    accent:   Colors.ramayanaAccent,
    shadow:   'rgba(46,125,94,0.35)',
    overlay:  ['transparent', 'rgba(4,14,10,0.55)', 'rgba(3,11,8,0.93)'] as const,
  },
  {
    id:       'mahabharata',
    cover:    require('@/assets/mahabarata.png'),
    sym:      '✦',
    name:     'Mahabharata',
    subtitle: 'The Great War',
    epigraph: 'The longest story ever told. Everything that has ever happened, it is said, is somewhere in the Mahabharata.',
    stats:    '18 Parvas · 73,452 Verses',
    accent:   Colors.mahabharataAccent,
    shadow:   'rgba(139,58,58,0.35)',
    overlay:  ['transparent', 'rgba(14,5,5,0.55)', 'rgba(11,4,4,0.93)'] as const,
  },
];

export default function ScripturesScreen() {
  const router = useRouter();

  function open(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(app)/scripture/[id]', params: { id } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar title="Scriptures" subtitle="Sacred texts of the dharmic tradition" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Intro line */}
        <Text style={styles.intro}>
          Three texts. Thousands of years. One question.
        </Text>

        {/* Cover cards */}
        {SCRIPTURES.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => open(s.id)}
            activeOpacity={0.92}
            style={[
              styles.card,
              {
                shadowColor: s.shadow,
                borderColor: s.accent + '28',
              },
            ]}
          >
            <ImageBackground
              source={s.cover}
              style={styles.coverImage}
              imageStyle={styles.coverImageInner}
              resizeMode="cover"
            >
              {/* Gradient overlay — fades in from 45% down */}
              <LinearGradient
                colors={s.overlay}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.overlay}
              />

              {/* Content pinned to bottom */}
              <View style={styles.content}>

                {/* Symbol + title */}
                <View style={styles.titleRow}>
                  <Text style={[styles.sym, { color: s.accent }]}>{s.sym}</Text>
                  <View style={styles.titleBlock}>
                    <Text style={styles.name}>{s.name}</Text>
                    <Text style={[styles.subtitle, { color: s.accent }]}>{s.subtitle}</Text>
                  </View>
                </View>

                {/* Thin rule */}
                <View style={[styles.rule, { backgroundColor: s.accent + '50' }]} />

                {/* Epigraph */}
                <Text style={styles.epigraph}>{s.epigraph}</Text>

                {/* Footer */}
                <View style={styles.footer}>
                  <View style={[styles.statsPill, { borderColor: s.accent + '35' }]}>
                    <Text style={[styles.stats, { color: s.accent }]}>{s.stats}</Text>
                  </View>
                  <View style={[styles.enterBtn, { backgroundColor: s.accent }]}>
                    <Text style={styles.enterText}>Enter  ›</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}

        {/* Closing */}
        <View style={styles.closing}>
          <Text style={styles.closingOrnament}>✦  ·  ✦</Text>
          <Text style={styles.closingText}>97,555 verses · AI-guided wisdom</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg0 },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 24,
    alignItems: 'center',
  },

  intro: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.md,
    color: Colors.text2, lineHeight: 26, textAlign: 'center',
    letterSpacing: 0.2,
  },

  // ── Cover card ────────────────────────────────────
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 16,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  coverImageInner: {
    borderRadius: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },

  // ── Text content ──────────────────────────────────
  content: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sym: {
    fontFamily: Fonts.cinzel,
    fontSize: 28,
  },
  titleBlock: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: Fonts.cinzelBold,
    fontSize: FontSize.lg,
    color: Colors.text0,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontFamily: Fonts.garamondItalic,
    fontSize: FontSize.sm,
    letterSpacing: 0.3,
  },
  rule: {
    height: 0.5,
    width: 48,
  },
  epigraph: {
    fontFamily: Fonts.garamondItalic,
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statsPill: {
    borderWidth: 0.5,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  stats: {
    fontFamily: Fonts.cinzel,
    fontSize: 8.5,
    letterSpacing: 1.2,
  },
  enterBtn: {
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  enterText: {
    fontFamily: Fonts.cinzel,
    fontSize: 10,
    color: '#000',
    letterSpacing: 1,
  },

  // ── Closing ───────────────────────────────────────
  closing: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  closingOrnament: {
    fontFamily: Fonts.cinzel,
    fontSize: 10,
    color: Colors.goldDim,
    letterSpacing: 6,
  },
  closingText: {
    fontFamily: Fonts.garamond,
    fontSize: FontSize.xs,
    color: Colors.text2,
    letterSpacing: 0.5,
  },
});
