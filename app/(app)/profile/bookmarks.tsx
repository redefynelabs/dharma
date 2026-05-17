// app/(app)/profile/bookmarks.tsx
// Shows all locally-bookmarked verses. Navigates back to the verse reader on tap.

import { useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark } from 'lucide-react-native';
import { useBookmarkStore, BookmarkEntry } from '@/store/bookmarkStore';
import { useThemeColors, ThemeColors, Fonts, FontSize, Spacing, Radius } from '@/theme';

export default function BookmarksScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const { bookmarks, toggleBookmark } = useBookmarkStore();

  function openVerse(entry: BookmarkEntry) {
    router.push({
      pathname: '/(app)/reader/verse' as any,
      params: {
        book: entry.book,
        id: entry.id,
        sectionKey: entry.sectionKey,
        unitKey: entry.unitKey,
        verseIndex: String(entry.verseIndex),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Topbar ── */}
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bookmarks</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {bookmarks.length === 0 ? (
          <View style={styles.empty}>
            <Bookmark size={36} color={colors.gold} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 14 }} />
            <Text style={styles.emptyTitle}>No bookmarks yet</Text>
            <Text style={styles.emptySub}>
              Tap the bookmark icon on any verse to save it here.
            </Text>
          </View>
        ) : (
          bookmarks.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.card}
              onPress={() => openVerse(entry)}
              activeOpacity={0.75}
            >
              {/* Accent bar */}
              <View style={[styles.accentBar, { backgroundColor: entry.accent }]} />

              <View style={styles.cardBody}>
                {/* Sym + Ref */}
                <View style={styles.cardHeader}>
                  <Text style={[styles.sym, { color: entry.accent }]}>{entry.sym}</Text>
                  <Text style={[styles.ref, { color: entry.accent }]}>{entry.ref}</Text>

                  {/* Remove bookmark */}
                  <TouchableOpacity
                    onPress={() => toggleBookmark(entry)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Bookmark size={16} color={entry.accent} strokeWidth={2} style={{ opacity: 0.6 }} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.preview} numberOfLines={3}>{entry.preview}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function useStyles(c: ThemeColors) {
  return useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg0 },

    topbar: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.xl, paddingVertical: 10,
      borderBottomWidth: 0.5, borderBottomColor: `${c.gold}14`,
      gap: 8,
    },
    backBtn:     { width: 36, height: 36, justifyContent: 'center' },
    backBtnText: { fontFamily: Fonts.garamond, fontSize: 28, color: c.goldDim, lineHeight: 30 },
    title: {
      flex: 1, textAlign: 'center',
      fontFamily: Fonts.cinzel, fontSize: 13, color: c.text0, letterSpacing: 1.5,
    },

    scroll: { padding: Spacing.xl, paddingBottom: 100, gap: 14 },

    // Empty state
    empty: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingTop: 80, gap: 6,
    },
    emptyTitle: {
      fontFamily: Fonts.cinzel, fontSize: FontSize.base,
      color: c.text1, letterSpacing: 0.5,
    },
    emptySub: {
      fontFamily: Fonts.garamond, fontSize: FontSize.sm,
      color: c.text2, textAlign: 'center', maxWidth: 260, lineHeight: 22,
    },

    // Verse card
    card: {
      flexDirection: 'row',
      backgroundColor: c.bg2,
      borderRadius: Radius.lg,
      borderWidth: 0.5, borderColor: `${c.gold}18`,
      overflow: 'hidden',
    },
    accentBar: { width: 3 },
    cardBody: { flex: 1, padding: 14, gap: 8 },
    cardHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    sym: {
      fontFamily: Fonts.cinzel, fontSize: 12,
    },
    ref: {
      flex: 1,
      fontFamily: Fonts.cinzel, fontSize: 11, letterSpacing: 0.8,
    },
    preview: {
      fontFamily: Fonts.garamond, fontSize: FontSize.sm,
      color: c.text1, lineHeight: 22,
    },
  }), [c]);
}
