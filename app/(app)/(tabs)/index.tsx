import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Dimensions, ImageBackground, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { Share2 } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useReaderStore } from '@/store/readerStore';
import { PremiumBadge } from '@/components/UI';
import { Colors, Fonts, FontSize, Spacing, Radius, useThemeColors, ThemeColors } from '@/theme';
import { useMemo, useRef, useState } from 'react';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_H = Math.round(SCREEN_W * 9 / 16); // natural 16:9 height

// ─── Data ─────────────────────────────────────────────────────────────────────

const SCRIPTURES = [
  { key: 'gita',        sym: 'ॐ', label: 'Bhagavad Gita',    meta: '18 Chapters · 701 Verses',    accent: Colors.gitaAccent },
  { key: 'ramayana',    sym: '◈', label: 'Valmiki Ramayana', meta: '7 Kandas · 23,402 Verses',    accent: Colors.ramayanaAccent },
  { key: 'mahabharata', sym: '✦', label: 'Mahabharata',      meta: '18 Parvas · 73,452 Verses',   accent: Colors.mahabharataAccent },
];

const PROMPT_CHIPS = [
  'On duty and dharma',
  'On the nature of the soul',
  'On detachment',
  'On devotion to God',
  'On karma and action',
  'On peace of mind',
  'On death and rebirth',
  'On the gunas',
];

const VERSES = [
  { quote: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.', yoga: 'Karma Yoga', ref: 'Bhagavad Gita · 2.47' },
  { quote: 'The soul is never born nor dies at any time. It is unborn, eternal, ever-existing, and primeval.', yoga: 'Sankhya Yoga', ref: 'Bhagavad Gita · 2.20' },
  { quote: 'Just as a person puts on new garments, giving up old ones, the soul accepts new material bodies, giving up old and useless ones.', yoga: 'Sankhya Yoga', ref: 'Bhagavad Gita · 2.22' },
  { quote: 'Perform every action with your heart fixed on the Supreme. Be free from vain hopes and selfish thoughts.', yoga: 'Karma Yoga', ref: 'Bhagavad Gita · 3.30' },
  { quote: 'Whenever there is a decline in righteousness and a rise of irreligion — at that time I descend Myself.', yoga: 'Jnana Yoga', ref: 'Bhagavad Gita · 4.7' },
  { quote: 'One who has control over the mind is tranquil in heat and cold, in pleasure and pain, and in honour and dishonour.', yoga: 'Dhyana Yoga', ref: 'Bhagavad Gita · 6.7' },
  { quote: 'Among thousands of men, scarcely one strives for perfection; and of those who strive, scarcely one knows Me in truth.', yoga: 'Jnana-Vijnana Yoga', ref: 'Bhagavad Gita · 7.3' },
  { quote: 'I am the taste of water, the light of the sun and the moon, the syllable Om in the Vedic mantras.', yoga: 'Jnana-Vijnana Yoga', ref: 'Bhagavad Gita · 7.8' },
  { quote: 'For those who worship Me with devotion — I carry what they lack and preserve what they have.', yoga: 'Raja-Vidya Yoga', ref: 'Bhagavad Gita · 9.22' },
  { quote: 'I am the beginning, the middle and the end of all beings.', yoga: 'Vibhuti Yoga', ref: 'Bhagavad Gita · 10.20' },
  { quote: 'He who sees Me everywhere and sees everything in Me — I am not lost to him, and he is not lost to Me.', yoga: 'Jnana-Vijnana Yoga', ref: 'Bhagavad Gita · 6.30' },
  { quote: 'Fix your mind on Me, be devoted to Me, worship Me, bow down to Me. So shall you come to Me.', yoga: 'Bhakti Yoga', ref: 'Bhagavad Gita · 18.65' },
  { quote: 'Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.', yoga: 'Moksha Yoga', ref: 'Bhagavad Gita · 18.66' },
  { quote: 'Better is one\'s own dharma, though imperfectly performed, than the dharma of another well performed.', yoga: 'Karma Yoga', ref: 'Bhagavad Gita · 3.35' },
  { quote: 'Yoga is the journey of the self, through the self, to the self.', yoga: 'Dhyana Yoga', ref: 'Bhagavad Gita · 6.20' },
  { quote: 'The mind is restless, turbulent, strong and unyielding. I think it is more difficult to control than the wind.', yoga: 'Dhyana Yoga', ref: 'Bhagavad Gita · 6.34' },
  { quote: 'Let a man lift himself by himself; let him not degrade himself. The self alone is the friend of the self.', yoga: 'Dhyana Yoga', ref: 'Bhagavad Gita · 6.5' },
  { quote: 'Whatever you do, whatever you eat, whatever you offer or give away — do that as an offering to Me.', yoga: 'Raja-Vidya Yoga', ref: 'Bhagavad Gita · 9.27' },
  { quote: 'Knowledge is better than mere practice; meditation is better than knowledge; renunciation of fruits is better than meditation.', yoga: 'Bhakti Yoga', ref: 'Bhagavad Gita · 12.12' },
  { quote: 'I am Time, the destroyer of all; I have come to consume the world.', yoga: 'Vishwarupa Yoga', ref: 'Bhagavad Gita · 11.32' },
  { quote: 'Pleasures conceived in the world of the senses have a beginning and an end and so are a cause of suffering.', yoga: 'Karma-Sannyas Yoga', ref: 'Bhagavad Gita · 5.22' },
  { quote: 'A person not disturbed in mind even amidst the threefold miseries, free from attachment, fear, and anger — is called a sage of steady mind.', yoga: 'Sankhya Yoga', ref: 'Bhagavad Gita · 2.56' },
];

function getDailyVerse() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day   = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return VERSES[day % VERSES.length];
}
const DAILY = getDailyVerse();



// Divider 
function Divider({ label, c }: { label: string; c: ThemeColors }) {
  return (
    <View style={divStyles(c).row}>
      <View style={divStyles(c).line} />
      <Text style={divStyles(c).label}>{label}</Text>
      <View style={divStyles(c).line} />
    </View>
  );
}

const divStyles = (c: ThemeColors) => StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  line:  { flex: 1, height: 0.5, backgroundColor: c.goldBorder },
  label: { fontFamily: Fonts.cinzel, fontSize: 9, color: c.text2, letterSpacing: 3 },
});
// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const { user }  = useAuthStore();
  const isProUser = user?.subscription.tier === 'pro';
  const lastRead  = useReaderStore((s) => s.lastRead);
  const colors  = useThemeColors();
  const styles  = useStyles(colors);

  const hour     = new Date().getHours();
  const greeting = hour < 5 ? 'Good Night' : hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const shareCardRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

  async function handleShareVerse() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSharing(true);
    try {
      const uri = await (shareCardRef.current as any)?.capture();
      if (!uri) throw new Error('capture failed');
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Share — ${DAILY.ref}` });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support sharing.');
      }
    } catch {
      Alert.alert('Error', 'Could not capture share image.');
    } finally {
      setSharing(false);
    }
  }

  function openScripture(key: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(app)/scripture/[id]', params: { id: key } });
  }

  function askDharma(prefill?: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(app)/(tabs)/chat', params: prefill ? { prefill } : {} });
  }

  return (
    <View style={styles.root}>

      {/* ── Header scrim — always-visible dark gradient behind the header ──────── */}
      <LinearGradient
  colors={[colors.overlay, colors.overlayLight, 'transparent']}
  locations={[0, 0.55, 0.8, 1]}
        style={[styles.headerScrim, { height: insets.top + 110 }]}
        pointerEvents="none"
      />

      {/* ── Floating header — sits above everything ──────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.username} numberOfLines={1}>
            {user?.displayName ?? 'Seeker'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {!isProUser && <PremiumBadge onPress={() => router.push('/(app)/paywall')} />}
          <View style={styles.omRing}>
            <Text style={styles.omGlyph}>ॐ</Text>
          </View>
        </View>
      </View>

      {/* ── Scrollable content (banner is first item inside) ─────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={StyleSheet.absoluteFill}
      >
        {/* Banner scrolls with the content */}
        <ImageBackground
          source={require('@/assets/banner.png')}
          style={[styles.banner, { height: BANNER_H + insets.top }]}
          resizeMode="cover"
        >
          {/* overall dim for moodiness */}
          <View style={[StyleSheet.absoluteFill, styles.bannerDim]} />

<LinearGradient
  colors={['transparent', colors.overlayLight, colors.bg0]}
  locations={[0, 0.55, 1]}
  style={styles.bannerBottomFade}
/>

<LinearGradient
  colors={[colors.overlayLight, 'transparent']}
  start={{ x: 0, y: 0.5 }}
  end={{ x: 0.5, y: 0.5 }}
/>
        </ImageBackground>

        {/* ── Content below the banner ───────────────────────────────────────── */}
        <View style={styles.content}>

        {/* ── Verse of the Day ───────────────────────────────────────────────── */}
        <View style={styles.verseCard}>
          <LinearGradient
            colors={['rgba(200,137,42,0.13)', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.ring, styles.ring1]} />
          <View style={[styles.ring, styles.ring2]} />

          {/* Badge */}
          <View style={styles.verseBadge}>
            <View style={styles.verseBadgeDot} />
            <Text style={styles.verseBadgeText}>VERSE OF THE DAY</Text>
          </View>

          <Text style={styles.quoteGlyph}>❝</Text>
          <Text style={styles.quoteText}>{DAILY.quote}</Text>

          <View style={styles.verseDivider}>
            <View style={styles.verseDividerLine} />
            <Text style={styles.verseDividerDot}>·</Text>
            <View style={styles.verseDividerLine} />
          </View>

          <View style={styles.verseFooter}>
            <View style={styles.verseFooterMeta}>
              <Text style={styles.verseYoga}>{DAILY.yoga}</Text>
              <Text style={styles.verseRef}>{DAILY.ref}</Text>
            </View>
            <View style={styles.verseFooterActions}>
              <TouchableOpacity
                style={styles.shareBtn}
                activeOpacity={0.8}
                onPress={handleShareVerse}
                disabled={sharing}
              >
                <Share2 size={15} color={colors.gold} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.seekBtn}
                activeOpacity={0.8}
                onPress={() => askDharma(DAILY.quote)}
              >
                <LinearGradient
                  colors={['rgba(200,137,42,0.22)', 'rgba(200,137,42,0.10)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.seekBtnInner}
                >
                  <Text style={styles.seekBtnText}>Seek Wisdom  ›</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Recent Reading ─────────────────────────────────────────────────── */}
        {lastRead && (
          <>
            <Divider label="RECENT READING" c={colors} />
            <TouchableOpacity
              style={styles.continueCard}
              activeOpacity={0.82}
              onPress={() => router.push({
                pathname: '/(app)/reader/verse' as any,
                params: {
                  book: lastRead.book,
                  id: lastRead.verseId,
                  sectionKey: lastRead.sectionKey,
                  unitKey: lastRead.unitKey,
                  verseIndex: String(lastRead.verseIndex),
                },
              })}
            >
              <View style={[styles.continueBar, { backgroundColor: lastRead.accent }]} />
              <View style={styles.continueLeft}>
                <Text style={[styles.continueBookSym, { color: lastRead.accent }]}>{lastRead.sym}</Text>
                <Text style={[styles.continueRef, { color: lastRead.accent }]}>{lastRead.ref}</Text>
                <Text style={styles.continuePreview} numberOfLines={2}>{lastRead.preview}</Text>
              </View>
              <View style={[styles.continueCta, { borderColor: lastRead.accent + '40' }]}>
                <Text style={[styles.continueCtaText, { color: lastRead.accent }]}>Continue</Text>
                <Text style={[styles.continueCtaArrow, { color: lastRead.accent }]}>›</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* ── Sacred Library ─────────────────────────────────────────────────── */}
        <Divider label="SACRED LIBRARY" c={colors} />

        <View style={styles.scriptureList}>
          {SCRIPTURES.map((s) => (
            <TouchableOpacity
              key={s.key}
              onPress={() => openScripture(s.key)}
              activeOpacity={0.78}
              style={styles.scriptureRow}
            >
              <View style={[styles.scriptureBar, { backgroundColor: s.accent }]} />
              <Text style={[styles.scriptureSym, { color: s.accent }]}>{s.sym}</Text>
              <View style={styles.scriptureInfo}>
                <Text style={styles.scriptureName}>{s.label}</Text>
                <Text style={styles.scriptureMeta}>{s.meta}</Text>
              </View>
              <Text style={[styles.scriptureChevron, { color: s.accent + '90' }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Ask Dharma ─────────────────────────────────────────────────────── */}
        <Divider label="DHARMA GUIDE" c={colors} />

        <TouchableOpacity style={styles.askCard} activeOpacity={0.82} onPress={() => askDharma()}>
          <LinearGradient
            colors={['rgba(200,137,42,0.10)', 'rgba(200,137,42,0.03)', 'transparent']}
            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.askIconBox}>
            <Text style={styles.askIconText}>◎</Text>
          </View>
          <View style={styles.askBody}>
            <Text style={styles.askTitle}>Ask Dharma</Text>
            <Text style={styles.askSub}>AI wisdom grounded in sacred scripture</Text>
          </View>
          <View style={styles.askArrowBox}>
            <Text style={styles.askArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* ── Seek Guidance chips ────────────────────────────────────────────── */}
        <Divider label="SEEK GUIDANCE" c={colors} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {PROMPT_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={styles.chip}
              activeOpacity={0.75}
              onPress={() => askDharma(chip)}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Closing ornament ───────────────────────────────────────────────── */}
        <View style={styles.closing}>
          <Text style={styles.closingOrnament}>✦  ·  ✦</Text>
          <Text style={styles.closingText}>97,555 verses · AI-guided wisdom</Text>
        </View>

        </View>{/* end content */}
      </ScrollView>

      {/* ── Hidden share card for image export ──────────────────────────────── */}
      <View style={[styles.shareCardWrapper, { pointerEvents: 'none' }]}>
        <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 1 }} style={styles.shareCard}>
          <View style={styles.shareCardBg}>
            <View style={styles.shareCardOrnament}>
              <View style={styles.shareOrnLine} />
              <Text style={styles.shareOrnDot}>✦</Text>
              <View style={styles.shareOrnLine} />
            </View>
            <Text style={styles.shareCardBadge}>VERSE OF THE DAY</Text>
            <Text style={styles.shareCardQuote}>{DAILY.quote}</Text>
            <View style={styles.shareCardFooter}>
              <View style={styles.shareCardAccentBar} />
              <View>
                <Text style={styles.shareCardYoga}>{DAILY.yoga}</Text>
                <Text style={styles.shareCardRef}>{DAILY.ref}</Text>
                <Text style={styles.shareCardApp}>dharma · sacred scripture</Text>
              </View>
            </View>
          </View>
        </ViewShot>
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function useStyles(c: ThemeColors) {
  return useMemo(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg0 },

  // ── Header scrim (behind header, above scroll) ────────────────────────────
  headerScrim: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 9,
  },

  // ── Floating header ────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerLeft:  { flex: 1, marginRight: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: {
    fontFamily: Fonts.cinzel, fontSize: 9,
    color: c.goldDim, letterSpacing: 3, marginBottom: 4,
  },
  username: {
    fontFamily: Fonts.cinzelBold, fontSize: FontSize.xl,
    color: c.text0, letterSpacing: 0.5,
  },
  omRing: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(8,7,5,0.45)',
    borderWidth: 0.5, borderColor: c.goldBorder,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: c.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  omGlyph: { fontFamily: Fonts.cinzel, fontSize: 16, color: c.gold },

  // ── Banner (inside scroll) ─────────────────────────────────────────────────
  banner: { width: '100%' },
 bannerDim: {
  backgroundColor: c.overlayLight,
},
  bannerBottomFade: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 100,
  },

  // ── Content below banner ───────────────────────────────────────────────────
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
    gap: 28,
  },

  // ── ScrollView ─────────────────────────────────────────────────────────────
  scroll: { flexGrow: 1 },

  // ── Continue Reading card ──────────────────────────────────────────────────
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: c.bg2,
    borderWidth: 0.5, borderColor: 'rgba(200,137,42,0.14)',
    borderRadius: 14,
    paddingVertical: Spacing.lg, paddingRight: Spacing.lg, paddingLeft: 20,
    overflow: 'hidden',
  },
  continueBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
  },
  continueLeft: { flex: 1, gap: 5 },
  continueBookSym: {
    fontFamily: Fonts.cinzel, fontSize: 13, letterSpacing: 0.5,
  },
  continueRef: {
    fontFamily: Fonts.cinzelBold, fontSize: FontSize.sm, letterSpacing: 0.4,
  },
  continuePreview: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.sm,
    color: c.text2, lineHeight: 20,
  },
  continueCta: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    borderWidth: 0.5, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 7,
    flexShrink: 0,
  },
  continueCtaText: {
    fontFamily: Fonts.cinzel, fontSize: 9, letterSpacing: 1,
  },
  continueCtaArrow: {
    fontFamily: Fonts.garamond, fontSize: 16, lineHeight: 18,
  },

  // ── Verse of the Day card ──────────────────────────────────────────────────
  verseCard: {
    backgroundColor: c.bg2,
    borderWidth: 0.5,
    borderColor: c.goldBorder,
    borderRadius: 16,
    padding: Spacing.xl,
    overflow: 'hidden',
    gap: 16,
    shadowColor: c.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderColor: c.gold,
    borderWidth: 0.5,
    opacity: 0.04,
  },
  ring1: { width: 180, height: 180, right: -60, top: -60 },
  ring2: { width: 120, height: 120, right: -30, top: -30 },

  verseBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
  },
  verseBadgeDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: c.gold,
    shadowColor: c.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 4, elevation: 4,
  },
  verseBadgeText: {
    fontFamily: Fonts.cinzel, fontSize: 8.5,
    color: c.goldDim, letterSpacing: 2.5,
  },
  quoteGlyph: {
    fontFamily: Fonts.cinzel, fontSize: 38,
    color: c.gold, lineHeight: 34, marginBottom: -4,
  },
  quoteText: {
    fontFamily: Fonts.garamondItalic, fontSize: 18,
    color: c.text0, lineHeight: 32, letterSpacing: 0.15,
  },
  verseDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  verseDividerLine: {
    flex: 1, height: 0.5, backgroundColor: 'rgba(200,137,42,0.25)',
  },
  verseDividerDot: {
    fontFamily: Fonts.cinzel, fontSize: 12,
    color: c.gold, lineHeight: 14,
  },
  verseFooter: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', gap: 12,
  },
  verseFooterMeta: { flex: 1 },
  verseYoga: {
    fontFamily: Fonts.cinzel, fontSize: 10,
    color: c.gold, letterSpacing: 1, marginBottom: 3,
  },
  verseRef: {
    fontFamily: Fonts.garamond, fontSize: FontSize.xs,
    color: c.text2, letterSpacing: 0.5,
  },
  verseFooterActions: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0,
  },
  shareBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 0.5, borderColor: c.goldBorder,
    backgroundColor: 'rgba(200,137,42,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  seekBtn: {
    borderRadius: Radius.full, overflow: 'hidden',
    borderWidth: 0.5, borderColor: c.goldBorder, flexShrink: 0,
  },
  seekBtnInner: { paddingHorizontal: 16, paddingVertical: 8 },
  seekBtnText: {
    fontFamily: Fonts.cinzel, fontSize: 9.5,
    color: c.gold, letterSpacing: 1,
  },

  // ── Verse of the Day share card (off-screen) ────────────────────────────
  shareCardWrapper: { position: 'absolute', top: 10000, left: 0, right: 0 },
  shareCard:        { width: 360 },
  shareCardBg: {
    width: 360, backgroundColor: '#0f0d09',
    borderWidth: 1, borderColor: 'rgba(200,137,42,0.33)',
    borderRadius: 16, padding: 32, gap: 20,
  },
  shareCardOrnament: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  shareOrnLine:      { flex: 1, height: 0.5, backgroundColor: Colors.gitaAccent, opacity: 0.5 },
  shareOrnDot:       { fontFamily: Fonts.cinzel, fontSize: 10, color: Colors.gitaAccent },
  shareCardBadge: {
    fontFamily: Fonts.cinzel, fontSize: 8.5,
    color: '#c8892a', letterSpacing: 2.5, textAlign: 'center', marginBottom: -8,
  },
  shareCardQuote: {
    fontFamily: Fonts.garamondItalic, fontSize: 19, color: '#f0e8d8',
    lineHeight: 32, textAlign: 'center',
  },
  shareCardFooter:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  shareCardAccentBar: { width: 3, height: 44, borderRadius: 2, backgroundColor: Colors.gitaAccent },
  shareCardYoga: {
    fontFamily: Fonts.cinzel, fontSize: 10,
    color: Colors.gitaAccent, letterSpacing: 1, marginBottom: 2,
  },
  shareCardRef: {
    fontFamily: Fonts.cinzel, fontSize: 12,
    color: Colors.gitaAccent, letterSpacing: 1, marginBottom: 3,
  },
  shareCardApp: {
    fontFamily: Fonts.garamond, fontSize: 11, color: '#7a6a4a', letterSpacing: 1,
  },

  // ── Sacred Library ─────────────────────────────────────────────────────────
  scriptureList: { gap: 8 },
  scriptureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: c.bg2,
    borderWidth: 0.5, borderColor: 'rgba(200,137,42,0.10)',
    borderRadius: 12,
    paddingVertical: 16, paddingRight: Spacing.xl, paddingLeft: 20,
    overflow: 'hidden',
  },
  scriptureBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
  },
  scriptureSym: {
    fontFamily: Fonts.cinzel, fontSize: 22,
    width: 32, textAlign: 'center', flexShrink: 0,
  },
  scriptureInfo: { flex: 1 },
  scriptureName: {
    fontFamily: Fonts.cinzel, fontSize: FontSize.sm,
    color: c.text0, letterSpacing: 0.4, marginBottom: 3,
  },
  scriptureMeta: {
    fontFamily: Fonts.garamond, fontSize: FontSize.xs,
    color: c.text2, letterSpacing: 0.5,
  },
  scriptureChevron: {
    fontFamily: Fonts.garamond, fontSize: 20, lineHeight: 22, flexShrink: 0,
  },

  // ── Ask Dharma ─────────────────────────────────────────────────────────────
  askCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: c.bg2,
    borderWidth: 0.5, borderColor: c.goldBorder,
    borderRadius: 14, padding: Spacing.lg, overflow: 'hidden',
  },
  askIconBox: {
    width: 44, height: 44, borderRadius: 11,
    backgroundColor: 'rgba(200,137,42,0.12)',
    borderWidth: 0.5, borderColor: c.goldBorder,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  askIconText: { fontFamily: Fonts.cinzel, fontSize: 20, color: c.gold },
  askBody:  { flex: 1 },
  askTitle: {
    fontFamily: Fonts.cinzel, fontSize: FontSize.sm,
    color: c.text0, letterSpacing: 0.4, marginBottom: 3,
  },
  askSub: {
    fontFamily: Fonts.garamond, fontSize: FontSize.xs, color: c.text2,
  },
  askArrowBox: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.goldFaint,
    borderWidth: 0.5, borderColor: c.goldBorder,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  askArrow: {
    fontFamily: Fonts.garamond, fontSize: 20, lineHeight: 22, color: c.gold,
  },

  // ── Prompt chips ───────────────────────────────────────────────────────────
  chips: { gap: 8, paddingBottom: 4 },
  chip: {
    borderWidth: 0.5, borderColor: c.goldBorder,
    borderRadius: Radius.full,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: c.bg2,
  },
  chipText: {
    fontFamily: Fonts.garamond, fontSize: FontSize.sm,
    color: c.text1, letterSpacing: 0.2,
  },

  // ── Closing ────────────────────────────────────────────────────────────────
  closing: { alignItems: 'center', gap: 6 },
  closingOrnament: {
    fontFamily: Fonts.cinzel, fontSize: 10,
    color: c.goldDim, letterSpacing: 6,
  },
  closingText: {
    fontFamily: Fonts.garamond, fontSize: FontSize.xs,
    color: c.text2, letterSpacing: 0.5,
  },
}), [c]);
}
