// app/(app)/reader/verse.tsx — Book-style verse reader

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontSize, Spacing, Radius } from '@/theme';
import { useReaderStore } from '@/store/readerStore';
import type { GitaVerse, RamayanaVerse, MahabharataVerse, ScriptureVerse } from '@/types';
import {
  getGitaChapter,
  getRamayanaSargaVerses,
  getMahabharataChapterVerses,
  getVerseById,
} from '@/lib/scriptureReader';

const BOOK_ACCENT: Record<string, string> = {
  gita:        Colors.gitaAccent,
  ramayana:    Colors.ramayanaAccent,
  mahabharata: Colors.mahabharataAccent,
};

const BOOK_SYM: Record<string, string> = { gita: 'ॐ', ramayana: '◈', mahabharata: '✦' };

// ─── Chapter / section context metadata ───────────────────────────────────────

const GITA_CHAPTER_META: Record<number, { yoga: string; theme: string }> = {
  1:  { yoga: 'Arjuna Vishada Yoga',                   theme: "On the eve of battle, Arjuna is overcome by grief and refuses to fight, setting the stage for the Gita's teachings." },
  2:  { yoga: 'Sankhya Yoga',                          theme: 'Krishna imparts foundational knowledge — the immortality of the soul, the nature of duty, and the path of Buddhi Yoga.' },
  3:  { yoga: 'Karma Yoga',                            theme: 'Action performed without attachment to results is the path of liberation; no one can abstain from action even for a moment.' },
  4:  { yoga: 'Jnana Karma Sanyasa Yoga',              theme: 'Krishna reveals the eternal tradition of knowledge, the mystery of divine incarnation, and the transforming power of wisdom.' },
  5:  { yoga: 'Karma Sanyasa Yoga',                    theme: 'Renunciation of the fruits of action and selfless action are both paths to the same freedom — the wise see them as one.' },
  6:  { yoga: 'Dhyana Yoga',                           theme: 'The discipline of meditation: how to steady the mind, sit in stillness, and gradually lead the wandering self back to the Self.' },
  7:  { yoga: 'Jnana Vijnana Yoga',                    theme: 'Krishna reveals his dual nature — the manifest and the unmanifest — and explains why so few truly know him.' },
  8:  { yoga: 'Aksara Brahma Yoga',                    theme: 'On the imperishable Brahman, the nature of death and rebirth, and the path by which the yogi reaches the supreme abode.' },
  9:  { yoga: 'Raja Vidya Raja Guhya Yoga',            theme: 'The royal science and royal secret: devotion to the Divine is the most direct and joyful path to liberation.' },
  10: { yoga: 'Vibhuti Yoga',                          theme: 'Krishna enumerates his divine manifestations — every excellence, beauty, and power in creation is a spark of his glory.' },
  11: { yoga: 'Vishwarupa Darshana Yoga',              theme: "At Arjuna's request, Krishna reveals his overwhelming Cosmic Form — infinite, luminous, devouring all worlds." },
  12: { yoga: 'Bhakti Yoga',                           theme: 'Devotion is declared the highest path. Krishna describes the qualities of his dearest devotee with tender precision.' },
  13: { yoga: 'Kshetra Kshetrajna Vibhaga Yoga',      theme: 'The distinction between the field (body-mind) and the knower of the field (the true Self) is the ground of all knowledge.' },
  14: { yoga: 'Gunatraya Vibhaga Yoga',                theme: 'The three gunas — tamas, rajas, sattva — bind the soul to the body; one who transcends them attains immortality.' },
  15: { yoga: 'Purushottama Yoga',                     theme: 'The parable of the cosmic tree, the nature of the supreme Person who pervades and sustains all existence.' },
  16: { yoga: 'Daivasura Sampad Vibhaga Yoga',         theme: 'Two destinies: the divine qualities lead to liberation, the demonic to bondage. Know which qualities you carry.' },
  17: { yoga: 'Shraddhatraya Vibhaga Yoga',            theme: 'The three kinds of faith, food, sacrifice, and austerity reflect the three gunas and shape the character of the seeker.' },
  18: { yoga: 'Moksha Sanyasa Yoga',                   theme: 'The culminating chapter: a comprehensive summary of renunciation, duty, the nature of knowledge, and the final secret of devotion.' },
};

const RAMAYANA_KANDA_META: Record<number, { name: string; theme: string }> = {
  1: { name: 'Bala Kanda',       theme: "The birth of Rama and his brothers, his divine nature revealed, his early education under sage Vishwamitra, and his marriage to Sita." },
  2: { name: 'Ayodhya Kanda',    theme: "Dasaratha's promise to Kaikeyi forces Rama's exile. Rama accepts without complaint; Dasaratha dies of grief. The pathos of separation." },
  3: { name: 'Aranya Kanda',     theme: "Rama, Sita and Lakshmana dwell in the forest. Ravana, moved by Surpanakha's provocation, abducts Sita, severing the thread of the story." },
  4: { name: 'Kishkindha Kanda', theme: "Rama forges an alliance with the monkey-king Sugriva. Hanuman is revealed. The vast army of vanaras is assembled to search for Sita." },
  5: { name: 'Sundara Kanda',    theme: "Hanuman leaps to Lanka, finds Sita in the Ashoka grove, and brings her Rama's ring. A book of courage, devotion, and unwavering faith." },
  6: { name: 'Yuddha Kanda',     theme: "The bridge across the sea, the great war with Lanka, the slaying of Ravana, and Rama's return with Sita to Ayodhya in the divine chariot." },
  7: { name: 'Uttara Kanda',     theme: "The aftermath of the war: Rama's reign, the shadow of public doubt, Sita's exile, the birth of Lava and Kusha, and Rama's final departure." },
};

const MAHABHARATA_PARVA_META: Record<number, { name: string; theme: string }> = {
  1:  { name: 'Adi Parva',             theme: 'The origins of the Kuru dynasty, the birth of the Pandavas and Kauravas, their education, rivalry, and the early events leading toward war.' },
  2:  { name: 'Sabha Parva',           theme: 'The Pandavas build Indraprastha, Yudhishthira performs the Rajasuya. The fateful dice game strips the Pandavas of everything.' },
  3:  { name: 'Vana Parva',            theme: "Twelve years of forest exile — pilgrimage, austerity, stories of heroes and gods, and Arjuna's journey to obtain divine weapons." },
  4:  { name: 'Virata Parva',          theme: "The Pandavas spend their thirteenth year in disguise at King Virata's court. Their identities are nearly revealed." },
  5:  { name: 'Udyoga Parva',          theme: "Diplomatic efforts before the war. Krishna's peace mission fails. Both sides marshal their forces for the decisive conflict." },
  6:  { name: 'Bhishma Parva',         theme: 'The Bhagavad Gita is spoken here. Bhishma commands the Kaurava forces for ten days and falls on a bed of arrows.' },
  7:  { name: 'Drona Parva',           theme: "Drona commands after Bhishma falls. Abhimanyu is slain in the chakravyuha. Karna's cruelty and the war's moral unraveling." },
  8:  { name: 'Karna Parva',           theme: "Karna commands for two days. His fatal confrontation with Arjuna ends with his death — the tragedy of a noble soul on the wrong side." },
  9:  { name: 'Shalya Parva',          theme: 'Shalya commands briefly. Duryodhana falls to Bhima. The war ends, but at what cost? The fields of Kurukshetra lie silent.' },
  10: { name: 'Sauptika Parva',        theme: "Ashwatthama's midnight massacre of the sleeping Pandava camp. A descent into darkness, the horror of unchecked vengeance." },
  11: { name: 'Stri Parva',            theme: 'The lament of the women. Gandhari curses Krishna. Yudhishthira performs the last rites for the fallen — grief on an oceanic scale.' },
  12: { name: 'Shanti Parva',          theme: 'Bhishma, lying on his arrow-bed, teaches Yudhishthira the science of governance, dharma, and the nature of the liberated soul.' },
  13: { name: 'Anushasana Parva',      theme: "Bhishma's final teachings on charity, duty, and devotion before departing his body at the auspicious moment of Uttarayana." },
  14: { name: 'Ashvamedhika Parva',    theme: "Yudhishthira performs the horse sacrifice to expiate the war's sin. Krishna recounts the Anugita — a second, shorter teaching." },
  15: { name: 'Ashramavasika Parva',   theme: 'Dhritarashtra and Gandhari retire to the forest. Kunti goes with them. They attain liberation in a forest fire.' },
  16: { name: 'Mausala Parva',         theme: 'The Yadavas destroy each other in a fratricidal war. Krishna departs the world. Dwarka sinks beneath the sea.' },
  17: { name: 'Mahaprasthanika Parva', theme: 'The Pandavas renounce the kingdom and begin their final journey on foot toward the Himalayas, one by one falling along the way.' },
  18: { name: 'Svargarohana Parva',    theme: 'Yudhishthira alone reaches the gates of heaven. He refuses to abandon the faithful dog. The final test, and the revelation of truth.' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Split Gita word_meaning into {words, commentary}.
 *  The field embeds commentary after the word-for-word section. */
function parseGitaWordMeaning(raw: string): { words: string; commentary: string | null } {
  if (!raw) return { words: '', commentary: null };
  // "No Commentary." → strip it, return no commentary
  const noComIdx = raw.indexOf('No Commentary');
  if (noComIdx !== -1) {
    return { words: raw.slice(0, noComIdx).trim(), commentary: null };
  }
  // Real commentary follows the word "Commentary" (sometimes ".Commentary")
  const comIdx = raw.indexOf('Commentary');
  if (comIdx === -1) return { words: raw.trim(), commentary: null };
  const words = raw.slice(0, comIdx).replace(/\.\s*$/, '').trim();
  const commentary = raw.slice(comIdx + 'Commentary'.length).replace(/^\s*[\-–—:]\s*/, '').trim();
  return { words, commentary: commentary || null };
}

/** Format the word-by-word string into an array of {term, meaning} pairs for display. */
function parseWordPairs(raw: string): Array<{ term: string; meaning: string }> {
  if (!raw) return [];
  // Remove leading verse number like "1.1 "
  const clean = raw.replace(/^\d+\.\d+\s+/, '').trim();
  // Split on "?" separator (used in Gita data) or commas between pairs
  const chunks = clean.split(/[?।]/);
  const pairs: Array<{ term: string; meaning: string }> = [];
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    // Each chunk is like "धर्मक्षेत्रे on the holy plain"
    // Find the split point: first space after a non-latin word boundary
    const spaceIdx = trimmed.search(/\s/);
    if (spaceIdx === -1) continue;
    const term = trimmed.slice(0, spaceIdx).trim();
    const meaning = trimmed.slice(spaceIdx).trim();
    if (term && meaning) pairs.push({ term, meaning });
  }
  return pairs;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VerseScreen() {
  const {
    book, id, sectionKey, unitKey, verseIndex,
  } = useLocalSearchParams<{
    book: string; id: string;
    sectionKey?: string; unitKey?: string; verseIndex?: string;
  }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const accent  = BOOK_ACCENT[book] ?? Colors.gold;
  const scrollRef = useRef<ScrollView>(null);

  const [exporting, setExporting] = useState(false);
  const shareCardRef = useRef<ViewShot>(null);

  // ─── Build verse list for prev/next ────────────────────────────────────────
  const verseList = useMemo<ScriptureVerse[]>(() => {
    if (!sectionKey) return [];
    const sn = Number(sectionKey);
    const un = unitKey ? Number(unitKey) : undefined;
    if (book === 'gita') return getGitaChapter(sn);
    if (book === 'ramayana' && un) return getRamayanaSargaVerses(sn, un);
    if (book === 'mahabharata' && un) return getMahabharataChapterVerses(sn, un);
    return [];
  }, [book, sectionKey, unitKey]);

  const idx     = verseIndex !== undefined ? Number(verseIndex) : -1;
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < verseList.length - 1;

  const verse = getVerseById(id);
  const setLastRead = useReaderStore((s) => s.setLastRead);

  useEffect(() => {
    if (!verse) return;
    setLastRead({
      book,
      sectionKey: sectionKey ?? '',
      unitKey,
      verseId: id,
      verseIndex: idx >= 0 ? idx : 0,
      ref: verse.reference ?? id,
      preview: (verse.english ?? '').slice(0, 120),
      sym: BOOK_SYM[book] ?? 'ॐ',
      accent: BOOK_ACCENT[book] ?? Colors.gold,
      timestamp: Date.now(),
    });
  }, [id]);

  function navigateTo(newIdx: number) {
    const target = verseList[newIdx];
    if (!target) return;
    Haptics.selectionAsync();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    router.replace({
      pathname: '/(app)/reader/verse' as any,
      params: { book, id: target.id, sectionKey, unitKey, verseIndex: String(newIdx) },
    });
  }

  async function captureCard(): Promise<string | null> {
    try {
      const uri = await (shareCardRef.current as any)?.capture();
      return uri ?? null;
    } catch {
      return null;
    }
  }

  async function handleShare() {
    if (!verse) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExporting(true);
    try {
      const uri = await captureCard();
      if (!uri) throw new Error('Could not capture image');
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Share — ${verse.reference}` });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support sharing.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not share verse.');
    } finally {
      setExporting(false);
    }
  }

  async function handleDownload() {
    if (!verse) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow photo library access to save the verse image.');
        return;
      }
      const uri = await captureCard();
      if (!uri) throw new Error('Could not capture image');
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', 'Verse image saved to your photo library.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save image.');
    } finally {
      setExporting(false);
    }
  }

  if (!verse) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Verse not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={[styles.notFoundText, { color: accent }]}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const gita     = book === 'gita'        ? (verse as GitaVerse)        : null;
  const ramayana = book === 'ramayana'    ? (verse as RamayanaVerse)    : null;
  const mbh      = book === 'mahabharata' ? (verse as MahabharataVerse) : null;

  // ── Derived content ──────────────────────────────────────────────────────
  const hindi = gita?.hindi || mbh?.hindi;

  // For Gita: extract commentary from word_meaning
  let wordMeaning = '';
  let commentary  = '';
  if (gita) {
    const parsed = parseGitaWordMeaning(gita.word_meaning ?? '');
    wordMeaning  = parsed.words;
    commentary   = parsed.commentary ?? '';
  } else if (ramayana) {
    wordMeaning = ramayana.word_meaning ?? '';
    commentary  = ramayana.commentary  ?? '';
  } else if (mbh) {
    commentary = mbh.commentary ?? '';
  }

  const wordPairs = parseWordPairs(wordMeaning);

  // ── Context header text ──────────────────────────────────────────────────
  const sectionNum = sectionKey ? Number(sectionKey) : 0;
  let contextTitle = '';
  let contextTheme = '';
  if (gita && sectionNum) {
    const m = GITA_CHAPTER_META[sectionNum];
    contextTitle = m ? m.yoga : `Chapter ${sectionNum}`;
    contextTheme = m?.theme ?? '';
  } else if (ramayana && sectionNum) {
    const m = RAMAYANA_KANDA_META[sectionNum];
    contextTitle = m ? m.name : `Kanda ${sectionNum}`;
    contextTheme = m?.theme ?? '';
  } else if (mbh && sectionNum) {
    const m = MAHABHARATA_PARVA_META[sectionNum];
    contextTitle = m ? m.name : `Parva ${sectionNum}`;
    contextTheme = m?.theme ?? '';
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ── Top bar ── */}
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.topbarCenter}>
          <Text style={[styles.refLabel, { color: accent }]} numberOfLines={1}>
            {verse.reference}
          </Text>
          {contextTitle ? (
            <Text style={styles.contextLabel} numberOfLines={1}>{contextTitle}</Text>
          ) : null}
        </View>

        <View style={styles.topbarActions}>
          {exporting ? (
            <ActivityIndicator size="small" color={accent} style={{ width: 60 }} />
          ) : (
            <>
              <TouchableOpacity
                onPress={handleDownload}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                style={styles.topbarBtn}
              >
                <Ionicons name="download-outline" size={20} color={accent} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                style={styles.topbarBtn}
              >
                <Ionicons name="paper-plane-outline" size={20} color={accent} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ── Page content ── */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.page, { paddingBottom: 100 + insets.bottom }]}
      >

        {/* ── Verse position & chapter context ── */}
        <View style={styles.chapterContextRow}>
          {contextTitle ? (
            <Text style={[styles.chapterContextTitle, { color: accent }]}>{contextTitle}</Text>
          ) : null}
          {idx >= 0 && (
            <Text style={[styles.versePosition, { color: accent + '99' }]}>
              {idx + 1} / {verseList.length}
            </Text>
          )}
        </View>

        {/* ── Sanskrit ── */}
        {verse.sanskrit ? (
          <View style={styles.sanskritBlock}>
            <Text style={styles.sanskrit}>{verse.sanskrit}</Text>
          </View>
        ) : null}

        {/* ── Transliteration ── */}
        {verse.transliteration ? (
          <Text style={[styles.transliteration, { color: accent + 'CC' }]}>
            {verse.transliteration}
          </Text>
        ) : null}

        {/* ── Ornament ── */}
        <View style={styles.ornamentRow}>
          <View style={[styles.ornamentLine, { backgroundColor: accent, opacity: 0.2 }]} />
          <Text style={[styles.ornamentDot, { color: accent, opacity: 0.7 }]}>✦</Text>
          <View style={[styles.ornamentLine, { backgroundColor: accent, opacity: 0.2 }]} />
        </View>

        {/* ── Translation — the hero ── */}
        <Text style={styles.translation}>{verse.english}</Text>

        {/* ── Hindi ── */}
        {hindi ? (
          <View style={[styles.hindiBlock, { borderLeftColor: accent + '50' }]}>
            <Text style={[styles.hindiLang, { color: accent }]}>हिन्दी</Text>
            <Text style={styles.hindiText}>{hindi}</Text>
          </View>
        ) : null}

        {/* ── Word by Word meanings ── */}
        {wordPairs.length > 0 ? (
          <View style={[styles.section, { borderTopColor: accent + '18' }]}>
            <Text style={[styles.sectionHeading, { color: accent }]}>Word by Word</Text>
            <View style={styles.wordGrid}>
              {wordPairs.map((p, i) => (
                <View key={i} style={styles.wordPair}>
                  <Text style={[styles.wordTerm, { color: accent }]}>{p.term}</Text>
                  <Text style={styles.wordMeaning}>{p.meaning}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : wordMeaning ? (
          <View style={[styles.section, { borderTopColor: accent + '18' }]}>
            <Text style={[styles.sectionHeading, { color: accent }]}>Word by Word</Text>
            <Text style={styles.sectionBody}>{wordMeaning}</Text>
          </View>
        ) : null}

        {/* ── Commentary ── */}
        {commentary ? (
          <View style={[styles.commentaryBlock, { borderColor: accent + '22', backgroundColor: accent + '06' }]}>
            <View style={styles.commentaryHeader}>
              <View style={[styles.commentaryBar, { backgroundColor: accent }]} />
              <Text style={[styles.commentaryHeading, { color: accent }]}>Commentary</Text>
            </View>
            <Text style={styles.commentaryText}>{commentary}</Text>
          </View>
        ) : null}

        {/* ── Chapter theme (shown once per verse, subtle) ── */}
        {contextTheme ? (
          <View style={[styles.themeBlock, { borderColor: accent + '15' }]}>
            <Text style={[styles.themeHeading, { color: accent + 'AA' }]}>
              {book === 'gita' ? 'Chapter Theme' : book === 'ramayana' ? 'Book Overview' : 'Parva Overview'}
            </Text>
            <Text style={styles.themeText}>{contextTheme}</Text>
          </View>
        ) : null}

        {/* ── Ask Dharma ── */}
        <TouchableOpacity
          style={[styles.askBtn, { borderColor: accent + '35' }]}
          activeOpacity={0.8}
          onPress={() => router.push({
            pathname: '/(app)/(tabs)/chat' as any,
            params: { prefill: `Explain this verse: ${verse.reference} — ${verse.english?.slice(0, 80)}` },
          })}
        >
          <View style={[styles.askIconBox, { backgroundColor: accent + '12' }]}>
            <Text style={[styles.askIcon, { color: accent }]}>◎</Text>
          </View>
          <View style={styles.askBody}>
            <Text style={styles.askTitle}>Ask Dharma about this verse</Text>
            <Text style={styles.askSub}>Deeper insight through AI guidance</Text>
          </View>
          <Text style={[styles.askArrow, { color: accent }]}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Prev / Next bar ── */}
      <View style={[styles.navBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
          onPress={() => hasPrev && navigateTo(idx - 1)}
          disabled={!hasPrev}
          activeOpacity={0.7}
        >
          <Text style={[styles.navBtnText, !hasPrev && styles.navBtnTextDisabled]}>‹  Previous</Text>
        </TouchableOpacity>

        <View style={[styles.navDot, { backgroundColor: accent }]} />

        <TouchableOpacity
          style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
          onPress={() => hasNext && navigateTo(idx + 1)}
          disabled={!hasNext}
          activeOpacity={0.7}
        >
          <Text style={[styles.navBtnText, { textAlign: 'right' }, !hasNext && styles.navBtnTextDisabled]}>
            Next  ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Hidden verse card for image export ── */}
      <View style={[styles.shareCardWrapper, { pointerEvents: 'none' }]}>
        <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 1 }} style={styles.shareCard}>
          <View style={[styles.shareCardBg, { borderColor: accent + '55' }]}>
            <View style={styles.shareCardOrnament}>
              <View style={[styles.shareOrnLine, { backgroundColor: accent }]} />
              <Text style={[styles.shareOrnDot, { color: accent }]}>✦</Text>
              <View style={[styles.shareOrnLine, { backgroundColor: accent }]} />
            </View>
            {verse.sanskrit ? (
              <Text style={styles.shareCardSanskrit} numberOfLines={4}>{verse.sanskrit}</Text>
            ) : null}
            <Text style={styles.shareCardQuote}>{verse.english}</Text>
            <View style={styles.shareCardFooter}>
              <View style={[styles.shareCardAccentBar, { backgroundColor: accent }]} />
              <View>
                <Text style={[styles.shareCardRef, { color: accent }]}>{verse.reference}</Text>
                <Text style={styles.shareCardApp}>dharma · sacred scripture</Text>
              </View>
            </View>
          </View>
        </ViewShot>
      </View>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:     { flex: 1, backgroundColor: Colors.bg0 },
  notFound:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontFamily: Fonts.garamond, fontSize: FontSize.md, color: Colors.text2 },

  // ── Topbar ──────────────────────────────────────────────────────────────
  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(200,137,42,0.08)',
    gap: 8,
  },
  backBtn:     { width: 36, height: 36, justifyContent: 'center', flexShrink: 0 },
  backBtnText: { fontFamily: Fonts.garamond, fontSize: 28, color: Colors.goldDim, lineHeight: 30 },
  topbarCenter: { flex: 1, gap: 2 },
  refLabel: {
    fontFamily: Fonts.cinzel, fontSize: 11, letterSpacing: 1,
  },
  contextLabel: {
    fontFamily: Fonts.garamondItalic, fontSize: 10, color: Colors.text2, letterSpacing: 0.3,
  },
  topbarActions: { flexDirection: 'row', alignItems: 'center', gap: 0, flexShrink: 0 },
  topbarBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // ── Page ────────────────────────────────────────────────────────────────
  page: { paddingHorizontal: 26, paddingTop: Spacing.xl, gap: 28 },

  // ── Chapter context row ──────────────────────────────────────────────────
  chapterContextRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  chapterContextTitle: {
    fontFamily: Fonts.cinzelBold, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  versePosition: {
    fontFamily: Fonts.cinzel, fontSize: 9, letterSpacing: 2,
  },

  // ── Sanskrit ────────────────────────────────────────────────────────────
  sanskritBlock: { paddingVertical: 4 },
  sanskrit: {
    fontFamily: Fonts.garamondItalic,
    fontSize: 20, color: Colors.text1,
    lineHeight: 38, textAlign: 'center', letterSpacing: 0.3,
  },

  // ── Transliteration ─────────────────────────────────────────────────────
  transliteration: {
    fontFamily: Fonts.garamondItalic,
    fontSize: FontSize.sm, lineHeight: 22,
    textAlign: 'center', opacity: 0.85,
    marginTop: -12,
  },

  // ── Ornament ────────────────────────────────────────────────────────────
  ornamentRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ornamentLine: { flex: 1, height: 0.5 },
  ornamentDot:  { fontFamily: Fonts.cinzel, fontSize: 10 },

  // ── Translation ─────────────────────────────────────────────────────────
  translation: {
    fontFamily: Fonts.garamond,
    fontSize: 22, color: Colors.text0,
    lineHeight: 42, textAlign: 'center',
    letterSpacing: 0.15,
  },

  // ── Hindi ───────────────────────────────────────────────────────────────
  hindiBlock: {
    borderLeftWidth: 2, paddingLeft: 16, gap: 6,
  },
  hindiLang: {
    fontFamily: Fonts.cinzel, fontSize: 9, letterSpacing: 2,
  },
  hindiText: {
    fontFamily: Fonts.garamond, fontSize: FontSize.md,
    color: Colors.text1, lineHeight: 28,
  },

  // ── Generic section ─────────────────────────────────────────────────────
  section: {
    borderTopWidth: 0.5, paddingTop: 20, gap: 14,
  },
  sectionHeading: {
    fontFamily: Fonts.cinzel, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
  },
  sectionBody: {
    fontFamily: Fonts.garamond, fontSize: FontSize.md,
    color: Colors.text1, lineHeight: 28,
  },

  // ── Word grid ───────────────────────────────────────────────────────────
  wordGrid: { gap: 10 },
  wordPair: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  wordTerm: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.sm,
    lineHeight: 22, minWidth: 90, flexShrink: 0,
  },
  wordMeaning: {
    flex: 1,
    fontFamily: Fonts.garamond, fontSize: FontSize.sm,
    color: Colors.text1, lineHeight: 22,
  },

  // ── Commentary block ────────────────────────────────────────────────────
  commentaryBlock: {
    borderWidth: 0.5, borderRadius: Radius.lg,
    padding: 20, gap: 14,
  },
  commentaryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  commentaryBar: {
    width: 3, height: 18, borderRadius: 2,
  },
  commentaryHeading: {
    fontFamily: Fonts.cinzel, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
  },
  commentaryText: {
    fontFamily: Fonts.garamond, fontSize: FontSize.md,
    color: Colors.text0, lineHeight: 32,
  },

  // ── Chapter theme ────────────────────────────────────────────────────────
  themeBlock: {
    borderWidth: 0.5, borderRadius: Radius.md,
    paddingVertical: 14, paddingHorizontal: 16, gap: 8,
  },
  themeHeading: {
    fontFamily: Fonts.cinzel, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
  },
  themeText: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.sm,
    color: Colors.text2, lineHeight: 22,
  },

  // ── Ask Dharma ──────────────────────────────────────────────────────────
  askBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 0.5, borderRadius: Radius.lg,
    padding: Spacing.lg, backgroundColor: Colors.bg2,
  },
  askIconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  askIcon:  { fontFamily: Fonts.cinzel, fontSize: 18 },
  askBody:  { flex: 1 },
  askTitle: {
    fontFamily: Fonts.cinzel, fontSize: FontSize.sm,
    color: Colors.text0, letterSpacing: 0.3, marginBottom: 3,
  },
  askSub:   {
    fontFamily: Fonts.garamond, fontSize: FontSize.xs, color: Colors.text2,
  },
  askArrow: { fontFamily: Fonts.garamond, fontSize: 22, lineHeight: 24 },

  // ── Prev / Next nav ─────────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: 14,
    borderTopWidth: 0.5, borderTopColor: 'rgba(200,137,42,0.1)',
    backgroundColor: Colors.bg0,
  },
  navBtn:             { flex: 1, paddingVertical: 8 },
  navBtnDisabled:     { opacity: 0.2 },
  navBtnText: {
    fontFamily: Fonts.cinzel, fontSize: 12,
    color: Colors.text1, letterSpacing: 0.5,
  },
  navBtnTextDisabled: { color: Colors.text2 },
  navDot: {
    width: 4, height: 4, borderRadius: 2, marginHorizontal: 16,
  },

  // ── Share card (off-screen) ──────────────────────────────────────────────
  shareCardWrapper: { position: 'absolute', top: 10000, left: 0, right: 0 },
  shareCard:        { width: 360 },
  shareCardBg: {
    width: 360, backgroundColor: '#0f0d09',
    borderWidth: 1, borderRadius: 16,
    padding: 32, gap: 20,
  },
  shareCardOrnament: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  shareOrnLine:      { flex: 1, height: 0.5, opacity: 0.5 },
  shareOrnDot:       { fontFamily: Fonts.cinzel, fontSize: 10 },
  shareCardSanskrit: {
    fontFamily: Fonts.garamondItalic, fontSize: 15, color: '#c4b48a',
    lineHeight: 26, textAlign: 'center',
  },
  shareCardQuote: {
    fontFamily: Fonts.garamond, fontSize: 19, color: '#f0e8d8',
    lineHeight: 32, textAlign: 'center',
  },
  shareCardFooter:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  shareCardAccentBar: { width: 3, height: 36, borderRadius: 2 },
  shareCardRef: {
    fontFamily: Fonts.cinzel, fontSize: 12, letterSpacing: 1, marginBottom: 3,
  },
  shareCardApp: {
    fontFamily: Fonts.garamond, fontSize: 11, color: '#7a6a4a', letterSpacing: 1,
  },
});
