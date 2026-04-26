import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSize, Spacing, Radius } from '@/theme';

// ── GoldButton ────────────────────────────────────────────────────────────────
interface GoldButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
}
export function GoldButton({ label, onPress, loading, style }: GoldButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={style}>
      <LinearGradient
        colors={['#c8892a', '#e8a83a', '#c8892a']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.goldBtn}
      >
        {loading
          ? <ActivityIndicator color={Colors.bg0} />
          : <Text style={styles.goldBtnText}>{label}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── OutlineButton ─────────────────────────────────────────────────────────────
interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  danger?: boolean;
}
export function OutlineButton({ label, onPress, style, danger }: OutlineButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={[styles.outlineBtn, danger && styles.dangerBtn, style]}>
      <Text style={[styles.outlineBtnText, danger && styles.dangerText]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── GhostButton ───────────────────────────────────────────────────────────────
interface GhostButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}
export function GhostButton({ label, onPress, style, textStyle }: GhostButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={[styles.ghostBtn, style]}>
      <Text style={[styles.ghostBtnText, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
interface TopbarProps {
  title?: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}
export function Topbar({ title, subtitle, left, right }: TopbarProps) {
  return (
    <View style={styles.topbar}>
      <View style={styles.topbarSide}>{left}</View>
      <View style={styles.topbarCenter}>
        {title && <Text style={styles.topbarTitle} numberOfLines={1}>{title}</Text>}
        {subtitle ? <Text style={styles.topbarSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.topbarSide, styles.topbarSideRight]}>{right}</View>
    </View>
  );
}

// ── BackButton ────────────────────────────────────────────────────────────────
export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={styles.backBtn}>
      <Text style={styles.backBtnText}>‹</Text>
    </TouchableOpacity>
  );
}

// ── ScripturePill ─────────────────────────────────────────────────────────────
export function ScripturePill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

// ── PremiumBadge ──────────────────────────────────────────────────────────────
export function PremiumBadge({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={['#c8892a', '#e8a83a']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.premiumBadge}
      >
        <Text style={styles.premiumText}>✦ PREMIUM</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
export function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  goldBtn: {
    paddingVertical: 15, paddingHorizontal: 28, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  goldBtnText: {
    fontFamily: Fonts.cinzelBold, fontSize: FontSize.sm,
    letterSpacing: 2, color: Colors.bg0,
  },
  outlineBtn: {
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: Radius.sm,
    alignItems: 'center', borderWidth: 0.5, borderColor: Colors.goldBorder,
  },
  dangerBtn: { borderColor: 'rgba(192,57,43,0.3)' },
  outlineBtnText: { fontFamily: Fonts.cinzel, fontSize: FontSize.xs, letterSpacing: 2, color: Colors.text1 },
  dangerText: { color: Colors.danger },
  ghostBtn: { paddingVertical: 8, alignItems: 'center' },
  ghostBtnText: { fontFamily: Fonts.garamond, fontSize: FontSize.md, color: Colors.text2, letterSpacing: 0.5 },
  topbar: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bg0,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(200,137,42,0.12)',
  },
  topbarSide: { width: 52, justifyContent: 'center' },
  topbarSideRight: { alignItems: 'flex-end' },
  topbarCenter: { flex: 1, alignItems: 'center' },
  topbarTitle: {
    fontFamily: Fonts.cinzel, fontSize: 12,
    letterSpacing: 3, color: Colors.text0, textAlign: 'center',
  },
  topbarSubtitle: {
    fontFamily: Fonts.garamondItalic, fontSize: 11,
    color: Colors.text2, marginTop: 2, textAlign: 'center',
  },
  backBtn: { padding: 4, marginLeft: -4 },
  backBtnText: { fontFamily: Fonts.garamond, fontSize: 28, color: Colors.text1, lineHeight: 30 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full, backgroundColor: Colors.bg3,
    borderWidth: 0.5, borderColor: Colors.goldBorder,
  },
  pillIcon: { fontSize: 12 },
  pillText: { fontFamily: Fonts.garamond, fontSize: 12, color: Colors.text1, letterSpacing: 0.6 },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full,
  },
  premiumText: { fontFamily: Fonts.cinzel, fontSize: 10, letterSpacing: 1.5, color: Colors.bg0 },
  sectionLabel: {
    fontFamily: Fonts.garamond, fontSize: FontSize.xs,
    letterSpacing: 2.5, textTransform: 'uppercase', color: Colors.text2,
    marginBottom: 12,
  },
  divider: { height: 0.5, backgroundColor: 'rgba(200,137,42,0.12)' },
});
