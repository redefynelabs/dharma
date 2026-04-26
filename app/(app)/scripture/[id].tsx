import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BackButton, Topbar } from '@/components/UI';
import { Colors, Fonts, FontSize, Spacing, Radius } from '@/theme';

// ─── Section metadata ──────────────────────────────────────────────────────────

const GITA_SECTIONS = [
  { title: 'Chapter 1',  subtitle: 'Arjuna Vishada Yoga',                verses: 47 },
  { title: 'Chapter 2',  subtitle: 'Sankhya Yoga',                       verses: 72 },
  { title: 'Chapter 3',  subtitle: 'Karma Yoga',                          verses: 43 },
  { title: 'Chapter 4',  subtitle: 'Jnana Karma Sanyasa Yoga',            verses: 42 },
  { title: 'Chapter 5',  subtitle: 'Karma Sanyasa Yoga',                  verses: 29 },
  { title: 'Chapter 6',  subtitle: 'Dhyana Yoga',                         verses: 47 },
  { title: 'Chapter 7',  subtitle: 'Jnana Vijnana Yoga',                  verses: 30 },
  { title: 'Chapter 8',  subtitle: 'Aksara Brahma Yoga',                  verses: 28 },
  { title: 'Chapter 9',  subtitle: 'Raja Vidya Raja Guhya Yoga',          verses: 34 },
  { title: 'Chapter 10', subtitle: 'Vibhuti Yoga',                        verses: 42 },
  { title: 'Chapter 11', subtitle: 'Vishwarupa Darshana Yoga',            verses: 55 },
  { title: 'Chapter 12', subtitle: 'Bhakti Yoga',                         verses: 20 },
  { title: 'Chapter 13', subtitle: 'Kshetra Kshetrajna Vibhaga Yoga',     verses: 34 },
  { title: 'Chapter 14', subtitle: 'Gunatraya Vibhaga Yoga',              verses: 27 },
  { title: 'Chapter 15', subtitle: 'Purushottama Yoga',                   verses: 20 },
  { title: 'Chapter 16', subtitle: 'Daivasura Sampad Vibhaga Yoga',       verses: 24 },
  { title: 'Chapter 17', subtitle: 'Shraddhatraya Vibhaga Yoga',          verses: 28 },
  { title: 'Chapter 18', subtitle: 'Moksha Sanyasa Yoga',                 verses: 78 },
];

const RAMAYANA_SECTIONS = [
  { title: 'Bala Kanda',       subtitle: 'Book of Youth',            sargas: 77,  kandaNumber: 1 },
  { title: 'Ayodhya Kanda',    subtitle: 'Book of Ayodhya',          sargas: 119, kandaNumber: 2 },
  { title: 'Aranya Kanda',     subtitle: 'Book of the Forest',       sargas: 75,  kandaNumber: 3 },
  { title: 'Kishkindha Kanda', subtitle: 'Book of Kishkindha',       sargas: 67,  kandaNumber: 4 },
  { title: 'Sundara Kanda',    subtitle: 'Book of Beauty',           sargas: 68,  kandaNumber: 5 },
  { title: 'Yuddha Kanda',     subtitle: 'Book of War',              sargas: 131, kandaNumber: 6 },
  { title: 'Uttara Kanda',     subtitle: 'Book of the Future',       sargas: 111, kandaNumber: 7 },
];

const MAHABHARATA_SECTIONS = [
  { title: 'Adi Parva',             subtitle: 'Book of the Beginning',          parvaNumber: 1  },
  { title: 'Sabha Parva',           subtitle: 'Book of the Assembly Hall',       parvaNumber: 2  },
  { title: 'Vana Parva',            subtitle: 'Book of the Forest',              parvaNumber: 3  },
  { title: 'Virata Parva',          subtitle: 'Book of Virata',                  parvaNumber: 4  },
  { title: 'Udyoga Parva',          subtitle: 'Book of the Effort',              parvaNumber: 5  },
  { title: 'Bhishma Parva',         subtitle: 'Book of Bhishma',                 parvaNumber: 6  },
  { title: 'Drona Parva',           subtitle: 'Book of Drona',                   parvaNumber: 7  },
  { title: 'Karna Parva',           subtitle: 'Book of Karna',                   parvaNumber: 8  },
  { title: 'Shalya Parva',          subtitle: 'Book of Shalya',                  parvaNumber: 9  },
  { title: 'Sauptika Parva',        subtitle: 'Book of the Sleeping Warriors',   parvaNumber: 10 },
  { title: 'Stri Parva',            subtitle: 'Book of the Women',               parvaNumber: 11 },
  { title: 'Shanti Parva',          subtitle: 'Book of Peace',                   parvaNumber: 12 },
  { title: 'Anushasana Parva',      subtitle: 'Book of the Instructions',        parvaNumber: 13 },
  { title: 'Ashvamedhika Parva',    subtitle: 'Book of the Horse Sacrifice',     parvaNumber: 14 },
  { title: 'Ashramavasika Parva',   subtitle: 'Book of the Hermitage',           parvaNumber: 15 },
  { title: 'Mausala Parva',         subtitle: 'Book of the Clubs',               parvaNumber: 16 },
  { title: 'Mahaprasthanika Parva', subtitle: 'Book of the Great Journey',       parvaNumber: 17 },
  { title: 'Svargarohana Parva',    subtitle: 'Book of the Ascent to Heaven',    parvaNumber: 18 },
];

const META: Record<string, {
  name: string; sym: string; accent: string; glow: string;
  opening: string; totalVerses: string;
}> = {
  gita: {
    name: 'Bhagavad Gita', sym: 'ॐ',
    accent: Colors.gitaAccent, glow: 'rgba(200,137,42,0.16)',
    opening: 'The sacred dialogue between Arjuna and the divine Krishna, spoken on the battlefield of Kurukshetra. Eighteen chapters that contain every truth a seeker could need.',
    totalVerses: '701 verses · 18 chapters',
  },
  ramayana: {
    name: 'Valmiki Ramayana', sym: '◈',
    accent: Colors.ramayanaAccent, glow: 'rgba(46,125,94,0.16)',
    opening: "Composed by the sage Valmiki, the first poem ever written. It follows Rama from the palace of Ayodhya to the forests of Lanka and back — an unforgettable journey of love, duty, and grace.",
    totalVerses: '23,402 verses · 7 kandas',
  },
  mahabharata: {
    name: 'Mahabharata', sym: '✦',
    accent: Colors.mahabharataAccent, glow: 'rgba(139,58,58,0.16)',
    opening: "The world's longest epic. The sage Vyasa weaves together a hundred stories of honour and betrayal, war and peace. Whatever has happened in the world, it is said, is in the Mahabharata.",
    totalVerses: '73,452 verses · 18 parvas',
  },
};

export default function ScriptureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const meta = META[id ?? 'gita'];
  if (!meta) return null;

  function getNavParams(index: number) {
    if (id === 'gita')        return { book: 'gita',        sectionKey: String(index + 1) };
    if (id === 'ramayana')    return { book: 'ramayana',    sectionKey: String(RAMAYANA_SECTIONS[index].kandaNumber) };
    return                           { book: 'mahabharata', sectionKey: String(MAHABHARATA_SECTIONS[index].parvaNumber) };
  }

  function getSections() {
    if (id === 'gita')     return GITA_SECTIONS;
    if (id === 'ramayana') return RAMAYANA_SECTIONS;
    return MAHABHARATA_SECTIONS;
  }

  function getSectionCount(section: any): string {
    if ('verses' in section) return `${section.verses} verses`;
    if ('sargas' in section) return `${section.sargas} sargas`;
    return '';
  }

  const sections = getSections();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar left={<BackButton onPress={() => router.back()} />} title={meta.name} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero ──────────────────────────────────── */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[meta.glow, 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={styles.heroGlow}
          />
          <View style={[styles.symbolRing, { borderColor: meta.accent + '60' }]}>
            <Text style={[styles.heroSym, { color: meta.accent }]}>{meta.sym}</Text>
          </View>
          <Text style={styles.heroName}>{meta.name}</Text>
          <Text style={[styles.heroBadge, { color: meta.accent }]}>{meta.totalVerses}</Text>
          <Text style={styles.heroOpening}>{meta.opening}</Text>
        </View>

        {/* ── Ask Dharma ────────────────────────────── */}
        <TouchableOpacity
          style={[styles.askRow, { borderColor: meta.accent + '35' }]}
          onPress={() => router.push({
            pathname: '/(app)/(tabs)/chat',
            params: { prefill: `Tell me about the ${meta.name}` },
          })}
          activeOpacity={0.8}
        >
          <View style={[styles.askIcon, { backgroundColor: meta.accent + '18' }]}>
            <Text style={[styles.askIconText, { color: meta.accent }]}>◎</Text>
          </View>
          <View style={styles.askBody}>
            <Text style={styles.askTitle}>Ask Dharma about this scripture</Text>
            <Text style={styles.askSub}>AI guidance grounded in {meta.name}</Text>
          </View>
          <Text style={[styles.askArrow, { color: meta.accent }]}>›</Text>
        </TouchableOpacity>

        {/* ── Table of Contents ─────────────────────── */}
        <View style={styles.toc}>
          <View style={styles.tocHeader}>
            <View style={[styles.tocLine, { backgroundColor: meta.accent + '30' }]} />
            <Text style={styles.tocLabel}>CONTENTS</Text>
            <View style={[styles.tocLine, { backgroundColor: meta.accent + '30' }]} />
          </View>

          {sections.map((section: any, i) => {
            const count = getSectionCount(section);
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                style={styles.tocRow}
                onPress={() => router.push({
                  pathname: '/(app)/reader/[book]/[sectionKey]' as any,
                  params: getNavParams(i),
                })}
              >
                <Text style={[styles.tocNum, { color: meta.accent }]}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <View style={styles.tocInfo}>
                  <Text style={styles.tocTitle}>{section.title}</Text>
                  <Text style={styles.tocSubtitle}>{section.subtitle}</Text>
                </View>
                {count ? <Text style={styles.tocCount}>{count}</Text> : null}
                <Text style={styles.tocChevron}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg0 },
  scroll: { paddingBottom: 48 },

  // ── Hero ──────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingHorizontal: 28, paddingTop: 32, paddingBottom: 28,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(200,137,42,0.08)',
    overflow: 'hidden', gap: 12,
  },
  heroGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 180,
  },
  symbolRing: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 5,
  },
  heroSym:     { fontFamily: Fonts.cinzel, fontSize: 28 },
  heroName:    { fontFamily: Fonts.cinzelBold, fontSize: FontSize.xl, color: Colors.text0, letterSpacing: 1, textAlign: 'center' },
  heroBadge:   { fontFamily: Fonts.cinzel, fontSize: 10, letterSpacing: 1.5 },
  heroOpening: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.md,
    color: Colors.text1, textAlign: 'center', lineHeight: 27,
    marginTop: 4,
  },

  // ── Ask row ───────────────────────────────────────
  askRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: Spacing.xl, marginTop: 20,
    backgroundColor: Colors.bg2,
    borderWidth: 0.5, borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  askIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  askIconText: { fontFamily: Fonts.cinzel, fontSize: 18 },
  askBody:     { flex: 1 },
  askTitle:    { fontFamily: Fonts.cinzel, fontSize: FontSize.sm, color: Colors.text0, letterSpacing: 0.3, marginBottom: 3 },
  askSub:      { fontFamily: Fonts.garamond, fontSize: FontSize.xs, color: Colors.text2 },
  askArrow:    { fontFamily: Fonts.garamond, fontSize: 22, lineHeight: 24 },

  // ── Table of contents ─────────────────────────────
  toc: { marginTop: 28, paddingHorizontal: Spacing.xl },
  tocHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6,
  },
  tocLine: { flex: 1, height: 0.5 },
  tocLabel: {
    fontFamily: Fonts.cinzel, fontSize: 9,
    color: Colors.text2, letterSpacing: 3,
  },
  tocRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 15,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(200,137,42,0.06)',
  },
  tocNum: {
    fontFamily: Fonts.cinzel, fontSize: 11,
    letterSpacing: 0.5, width: 26, textAlign: 'right',
  },
  tocInfo:     { flex: 1 },
  tocTitle:    { fontFamily: Fonts.cinzel, fontSize: FontSize.sm, color: Colors.text0, letterSpacing: 0.3, marginBottom: 3 },
  tocSubtitle: { fontFamily: Fonts.garamondItalic, fontSize: FontSize.xs, color: Colors.text2 },
  tocCount:    { fontFamily: Fonts.garamond, fontSize: FontSize.xs, color: Colors.text2 },
  tocChevron:  { fontFamily: Fonts.garamond, fontSize: 20, color: Colors.text2, lineHeight: 22 },
});
