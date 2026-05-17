// app/(app)/reader/[book]/[sectionKey]/[unitKey].tsx
// Shows verses for a Ramayana sarga or Mahabharata chapter.
// Includes the sarga-level commentary as a "Story Context" header card.

import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native"; 
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton, Topbar } from "@/components/UI";
import { Colors, Fonts, FontSize, Spacing, Radius, ThemeColors, useThemeColors } from "@/theme";
import type { RamayanaVerse, MahabharataVerse } from "@/types";
import {
  getRamayanaSargaVerses,
  getMahabharataChapterVerses,
} from "@/lib/scriptureReader";

const BOOK_ACCENT: Record<string, string> = {
  ramayana: Colors.ramayanaAccent,
  mahabharata: Colors.mahabharataAccent,
};

export default function UnitScreen() {
  const { book, sectionKey, unitKey } = useLocalSearchParams<{
    book: string;
    sectionKey: string;
    unitKey: string;
  }>();
  const router = useRouter();
  const sectionNum = Number(sectionKey);
  const unitNum = Number(unitKey);
  const accent = BOOK_ACCENT[book] ?? Colors.gold;
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [loading, setLoading] = useState(true);
  const [verses, setVerses] = useState<(RamayanaVerse | MahabharataVerse)[]>(
    [],
  );

  const title = book === "ramayana" ? `Sarga ${unitNum}` : `Chapter ${unitNum}`;

  useEffect(() => {
    setTimeout(() => {
      if (book === "ramayana") {
        setVerses(getRamayanaSargaVerses(sectionNum, unitNum));
      } else {
        setVerses(getMahabharataChapterVerses(sectionNum, unitNum));
      }
      setLoading(false);
    }, 0);
  }, [book, sectionNum, unitNum]);

  // ── Extract context: sarga/chapter-level commentary from first verse ──
  // Ramayana: commentary describes what happens in this sarga (same for all verses in the sarga)
  // Mahabharata: may have per-verse commentary or be empty
  const sargaCommentary =
    !loading && verses.length > 0
      ? ((verses[0] as RamayanaVerse).commentary ?? "")
      : "";

  // ── Header: context card + unit title ────────────────────────────────
  const ListHeader = (
    <View>
      {/* ── Story context card (Ramayana sarga commentary) ── */}
      {sargaCommentary ? (
        <View
          style={[
            styles.contextCard,
            { borderColor: accent + "25", backgroundColor: accent + "05" },
          ]}
        >
          <View style={styles.contextCardHeader}>
            <View style={[styles.contextBar, { backgroundColor: accent }]} />
            <Text style={[styles.contextHeading, { color: accent }]}>
              {book === "ramayana" ? "Story Context" : "Context"}
            </Text>
          </View>
          <Text style={styles.contextBody}>{sargaCommentary}</Text>
        </View>
      ) : null}

      {/* ── Unit header ── */}
      <View style={[styles.unitHeader, { borderBottomColor: accent + "20" }]}>
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        <View style={styles.unitHeaderText}>
          <Text style={styles.unitName}>{title}</Text>
          <Text style={[styles.unitSub, { color: accent }]} numberOfLines={1}>
            {book === "ramayana" ? "Valmiki Ramayana" : "Mahabharata"}
          </Text>
        </View>
        {!loading && (
          <View style={[styles.countPill, { borderColor: accent + "40" }]}>
            <Text style={[styles.countPillText, { color: accent }]}>
              {verses.length} verses
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Topbar
        left={<BackButton onPress={() => router.back()} />}
        title={title}
        subtitle={book === "ramayana" ? "Valmiki Ramayana" : "Mahabharata"}
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={accent} size="small" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <FlatList<RamayanaVerse | MahabharataVerse>
          data={verses}
          keyExtractor={(v) => v.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeader}
          renderItem={({ item: verse, index }) => (
            <TouchableOpacity
              style={styles.verseRow}
              activeOpacity={0.72}
              onPress={() =>
                router.push({
                  pathname: "/(app)/reader/verse" as any,
                  params: {
                    book,
                    id: verse.id,
                    sectionKey,
                    unitKey,
                    verseIndex: String(index),
                  },
                })
              }
            >
              {/* Verse number */}
              <Text style={[styles.verseNum, { color: accent }]}>
                {String(verse.verse).padStart(2, "0")}
              </Text>

              {/* Content */}
              <View style={styles.verseContent}>
                {verse.reference ? (
                  <Text
                    style={[styles.verseRef, { color: accent + "AA" }]}
                    numberOfLines={1}
                  >
                    {verse.reference}
                  </Text>
                ) : null}
                <Text style={styles.verseEnglish} numberOfLines={3}>
                  {verse.english}
                </Text>
                {verse.sanskrit ? (
                  <Text style={styles.verseSanskrit} numberOfLines={1}>
                    {verse.sanskrit}
                  </Text>
                ) : null}
              </View>

              <Text style={[styles.chevron, { color: accent + "70" }]}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function useStyles(c: ThemeColors) {
  return useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: c.bg0 },
        loading: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        },
        loadingText: {
          fontFamily: Fonts.garamond,
          fontSize: FontSize.md,
          color: c.text2,
        },
        list: { paddingBottom: 48 },

        // ── Context card ──────────────────────────────────────────────────────
        contextCard: {
          marginHorizontal: Spacing.xl,
          marginTop: Spacing.xl,
          marginBottom: 8,
          borderWidth: 0.5,
          borderRadius: Radius.lg,
          padding: 16,
          gap: 10,
        },
        contextCardHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        contextBar: {
          width: 3,
          height: 16,
          borderRadius: 2,
        },
        contextHeading: {
          fontFamily: Fonts.cinzel,
          fontSize: 9,
          letterSpacing: 2,
          textTransform: "uppercase",
        },
        contextBody: {
          fontFamily: Fonts.garamond,
          fontSize: FontSize.md,
          color: c.text1,
          lineHeight: 28,
        },

        // ── Unit header ───────────────────────────────────────────────────────
        unitHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingRight: Spacing.xl,
          paddingVertical: 14,
          borderBottomWidth: 0.5,
          marginTop: 8,
        },
        accentBar: {
          width: 3,
          height: 44,
          borderRadius: 2,
        },
        unitHeaderText: { flex: 1 },
        unitName: {
          fontFamily: Fonts.cinzelBold,
          fontSize: FontSize.base,
          color: c.text0,
          letterSpacing: 0.5,
          marginBottom: 3,
        },
        unitSub: {
          fontFamily: Fonts.garamondItalic,
          fontSize: FontSize.sm,
        },
        countPill: {
          borderWidth: 0.5,
          borderRadius: Radius.full,
          paddingHorizontal: 10,
          paddingVertical: 4,
          backgroundColor: "rgba(200,137,42,0.04)",
        },
        countPillText: {
          fontFamily: Fonts.cinzel,
          fontSize: 9,
          letterSpacing: 1,
        },

        // ── Verse rows ────────────────────────────────────────────────────────
        verseRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          paddingVertical: 16,
          paddingRight: Spacing.xl,
          borderBottomWidth: 0.5,
          borderBottomColor: "rgba(200,137,42,0.06)",
        },
        verseNum: {
          fontFamily: Fonts.cinzelBold,
          fontSize: 13,
          letterSpacing: 0.5,
          width: 44,
          textAlign: "right",
          flexShrink: 0,
        },
        verseContent: { flex: 1 },
        verseRef: {
          fontFamily: Fonts.cinzel,
          fontSize: 9,
          letterSpacing: 0.8,
          marginBottom: 4,
        },
        verseEnglish: {
          fontFamily: Fonts.garamond,
          fontSize: FontSize.md,
          color: c.text0,
          lineHeight: 25,
          marginBottom: 5,
        },
        verseSanskrit: {
          fontFamily: Fonts.garamondItalic,
          fontSize: FontSize.xs,
          color: c.text2,
          lineHeight: 18,
        },

        chevron: { fontFamily: Fonts.garamond, fontSize: 20, lineHeight: 22 },
      }),
    [c],
  );
}
