import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { Topbar, BackButton } from '@/components/UI';
import { Colors, Fonts, FontSize, Spacing, Radius } from '@/theme';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

const TEXTS = [
  {
    sym:    'ॐ',
    title:  'Bhagavad Gita',
    stat:   '701 verses · 18 chapters',
    blurb:  'On the eve of the great war, a prince lays down his bow. What follows is an eighteen-chapter dialogue with the divine — a conversation about duty, the soul, and the nature of existence that has guided seekers for over five thousand years.',
    color:  Colors.gitaAccent,
    glow:   'rgba(200,137,42,0.15)',
  },
  {
    sym:    '◈',
    title:  'Valmiki Ramayana',
    stat:   '23,402 verses · 7 kandas',
    blurb:  'The life of Rama unfolds across seven books — a story of love, exile, war, and the unwavering pursuit of dharma. Composed by the sage Valmiki, it is poetry that became scripture, and scripture that became the heartbeat of a civilisation.',
    color:  Colors.ramayanaAccent,
    glow:   'rgba(46,125,94,0.15)',
  },
  {
    sym:    '✦',
    title:  'Mahabharata',
    stat:   '73,452 verses · 18 parvas',
    blurb:  'The longest epic ever written. Kingdoms rise and fall, heroes walk their impossible paths, and through it all the sage Vyasa asks a single question: what is a righteous life? Everything that has ever happened, it is said, is in the Mahabharata.',
    color:  Colors.mahabharataAccent,
    glow:   'rgba(139,58,58,0.15)',
  },
];

function Ornament() {
  return (
    <View style={styles.ornamentRow}>
      <View style={styles.ornamentLine} />
      <Text style={styles.ornamentGlyph}>✦</Text>
      <View style={styles.ornamentLine} />
    </View>
  );
}

function ChapterHead({ numeral, title }: { numeral: string; title: string }) {
  return (
    <View style={styles.chapterHead}>
      <Text style={styles.chapterNumeral}>{numeral}</Text>
      <Text style={styles.chapterTitle}>{title}</Text>
    </View>
  );
}

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar left={<BackButton onPress={() => router.back()} />} title="About Dharma" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Title Page ──────────────────────────────── */}
        <View style={styles.titlePage}>
          <View style={styles.symbolRing}>
            <Text style={styles.heroSymbol}>ॐ</Text>
          </View>
          <Text style={styles.heroTitle}>D H A R M A</Text>
          <Text style={styles.heroSub}>
            Ancient wisdom, present guidance
          </Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>Version {VERSION}</Text>
          </View>
        </View>

        <Ornament />

        {/* ── Chapter I ───────────────────────────────── */}
        <View style={styles.chapter}>
          <ChapterHead numeral="I" title="The Beginning" />

          {/* Drop cap paragraph */}
          <View style={styles.dropCapPara}>
            <Text style={styles.dropCap}>D</Text>
            <Text style={styles.dropCapBody}>
              harma was born from a simple question: how might a seeker living in the modern world find guidance from the scriptures that shaped a civilisation?
            </Text>
          </View>

          <Text style={styles.body}>
            The ancient texts have always been there — vast, luminous, and often
            difficult to approach. Priests memorised them. Scholars debated them.
            Poets transformed them into song. But for the ordinary seeker, standing
            at a crossroads and needing a word of counsel, they could feel impossibly
            distant.
          </Text>

          <Text style={styles.body}>
            We believed that could change. That artificial intelligence, guided
            carefully and grounded faithfully in verified scripture, could become
            a bridge between the eternal and the everyday.
          </Text>

          <Text style={styles.body}>
            And so Dharma came to be — not as a replacement for the texts,
            but as a companion for those learning to read them.
          </Text>
        </View>

        <Ornament />

        {/* ── Chapter II ──────────────────────────────── */}
        <View style={styles.chapter}>
          <ChapterHead numeral="II" title="The Sacred Library" />

          <Text style={styles.body}>
            Every answer Dharma offers is drawn from one of three texts — each a
            world unto itself, each chosen for the depth and completeness of its
            vision of human life.
          </Text>

          <View style={styles.textsList}>
            {TEXTS.map((t, i) => (
              <View key={t.title}>
                <View style={styles.textEntry}>
                  <LinearGradient
                    colors={[t.glow, 'transparent']}
                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                    style={styles.textEntryGlow}
                  />
                  <View style={[styles.accentBar, { backgroundColor: t.color }]} />
                  <View style={styles.textEntryBody}>
                    <View style={styles.textEntryHeader}>
                      <Text style={[styles.textSym, { color: t.color }]}>{t.sym}</Text>
                      <View>
                        <Text style={styles.textTitle}>{t.title}</Text>
                        <Text style={[styles.textStat, { color: t.color }]}>{t.stat}</Text>
                      </View>
                    </View>
                    <Text style={styles.textBlurb}>{t.blurb}</Text>
                  </View>
                </View>
                {i < TEXTS.length - 1 && <View style={styles.textSep} />}
              </View>
            ))}
          </View>

          <Text style={styles.statLine}>
            97,555 verses. One question at a time.
          </Text>
        </View>

        <Ornament />

        {/* ── Chapter III ─────────────────────────────── */}
        <View style={styles.chapter}>
          <ChapterHead numeral="III" title="The Path Forward" />

          <Text style={styles.body}>
            We do not claim that Dharma replaces a guru, a pandit, or a lifetime
            of study. What we do believe is that curiosity deserves an answer,
            and that the first step on any path is simply beginning.
          </Text>

          <View style={styles.pullQuote}>
            <Text style={styles.pullQuoteBar}>|</Text>
            <Text style={styles.pullQuoteText}>
              "Better is one's own dharma, though imperfectly performed, than
              the dharma of another well performed."
            </Text>
          </View>
          <Text style={styles.pullQuoteRef}>Bhagavad Gita · 3.35</Text>

          <Text style={styles.body}>
            Whatever brings you here — grief, curiosity, a philosophical question
            at midnight, or simply the desire to know — you are welcome.
            The texts have waited thousands of years. They can wait for you, too.
          </Text>
        </View>

        {/* ── Colophon ────────────────────────────────── */}
        <View style={styles.colophon}>
          <Ornament />
          <Text style={styles.colophonText}>
            Made with devotion
          </Text>
          <Text style={styles.colophonYear}>
            {new Date().getFullYear()}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const HPAD = 28;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg0 },
  scroll: { paddingBottom: 60 },

  // ── Title page ────────────────────────────────────
  titlePage: {
    alignItems: 'center',
    paddingTop: 40, paddingBottom: 36,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(200,137,42,0.08)',
  },
  symbolRing: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.bg2,
    borderWidth: 1, borderColor: 'rgba(200,137,42,0.35)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  heroSymbol: { fontFamily: Fonts.cinzel, fontSize: 30, color: Colors.gold },
  heroTitle: {
    fontFamily: Fonts.cinzelBold, fontSize: 17,
    color: Colors.text0, letterSpacing: 8, marginBottom: 10,
  },
  heroSub: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.sm,
    color: Colors.text2, textAlign: 'center', marginBottom: 20,
  },
  versionPill: {
    borderWidth: 0.5, borderColor: Colors.goldBorder,
    borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 4,
    backgroundColor: 'rgba(200,137,42,0.05)',
  },
  versionText: {
    fontFamily: Fonts.cinzel, fontSize: 9,
    color: Colors.goldDim, letterSpacing: 1.5,
  },

  // ── Ornament divider ──────────────────────────────
  ornamentRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: HPAD, paddingVertical: 28,
    gap: 14,
  },
  ornamentLine: {
    flex: 1, height: 0.5, backgroundColor: 'rgba(200,137,42,0.15)',
  },
  ornamentGlyph: {
    fontFamily: Fonts.cinzel, fontSize: 10,
    color: Colors.goldDim, letterSpacing: 2,
  },

  // ── Chapter ───────────────────────────────────────
  chapter: {
    paddingHorizontal: HPAD,
    gap: 20,
  },
  chapterHead: {
    alignItems: 'center', gap: 6, marginBottom: 4,
  },
  chapterNumeral: {
    fontFamily: Fonts.cinzel, fontSize: 10,
    color: Colors.goldDim, letterSpacing: 4,
  },
  chapterTitle: {
    fontFamily: Fonts.cinzelBold, fontSize: FontSize.lg,
    color: Colors.text0, letterSpacing: 1.5,
  },

  // ── Body text ─────────────────────────────────────
  body: {
    fontFamily: Fonts.garamond, fontSize: 17,
    color: Colors.text1, lineHeight: 31,
    letterSpacing: 0.15,
  },

  // ── Drop cap ──────────────────────────────────────
  dropCapPara: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 2,
  },
  dropCap: {
    fontFamily: Fonts.cinzelBold, fontSize: 56,
    color: Colors.gold, lineHeight: 52,
    marginRight: 4, marginTop: 2,
  },
  dropCapBody: {
    flex: 1,
    fontFamily: Fonts.garamond, fontSize: 17,
    color: Colors.text1, lineHeight: 31, letterSpacing: 0.15,
    paddingTop: 6,
  },

  // ── Texts list ────────────────────────────────────
  textsList: {
    backgroundColor: Colors.bg2,
    borderWidth: 0.5, borderColor: Colors.goldBorder,
    borderRadius: Radius.lg, overflow: 'hidden',
  },
  textEntry: {
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  textEntryGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  accentBar: { width: 3 },
  textEntryBody: {
    flex: 1,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    gap: 10,
  },
  textEntryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  textSym: {
    fontFamily: Fonts.cinzel, fontSize: 20,
  },
  textTitle: {
    fontFamily: Fonts.cinzelBold, fontSize: FontSize.sm,
    color: Colors.text0, letterSpacing: 0.5,
  },
  textStat: {
    fontFamily: Fonts.garamond, fontSize: FontSize.xs,
    letterSpacing: 0.3, marginTop: 1,
  },
  textBlurb: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.sm,
    color: Colors.text1, lineHeight: 23,
  },
  textSep: {
    height: 0.5, backgroundColor: 'rgba(200,137,42,0.07)',
    marginHorizontal: Spacing.lg,
  },
  statLine: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.md,
    color: Colors.text2, textAlign: 'center', letterSpacing: 0.3,
  },

  // ── Pull quote ────────────────────────────────────
  pullQuote: {
    flexDirection: 'row', gap: 14, alignItems: 'flex-start',
    paddingLeft: 4,
  },
  pullQuoteBar: {
    fontFamily: Fonts.garamond, fontSize: 32,
    color: Colors.gold, lineHeight: 36, marginTop: -4,
  },
  pullQuoteText: {
    flex: 1,
    fontFamily: Fonts.garamondItalic, fontSize: 18,
    color: Colors.text0, lineHeight: 30, letterSpacing: 0.2,
  },
  pullQuoteRef: {
    fontFamily: Fonts.garamond, fontSize: FontSize.xs,
    color: Colors.goldDim, letterSpacing: 1, paddingLeft: 28,
    marginTop: -10,
  },

  // ── Colophon ──────────────────────────────────────
  colophon: {
    alignItems: 'center', paddingBottom: 16,
  },
  colophonText: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.sm,
    color: Colors.text2, letterSpacing: 1,
    marginTop: 4,
  },
  colophonYear: {
    fontFamily: Fonts.cinzel, fontSize: 10,
    color: Colors.goldDim, letterSpacing: 2,
    marginTop: 4,
  },
});
