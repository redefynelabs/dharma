import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, Fonts, FontSize, Spacing, Radius, ThemeColors } from '@/theme';

// ── GoldButton ────────────────────────────────────────────────────────────────
interface GoldButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
}
export function GoldButton({ label, onPress, loading, style }: GoldButtonProps) {
  const c = useThemeColors();
  const styles = useStyles(c);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={style}>
      <LinearGradient
        colors={[c.gold, c.goldBright, c.gold]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.goldBtn}
      >
        {loading
          ? <ActivityIndicator color={c.bg0} />
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
  const c = useThemeColors();
  const styles = useStyles(c);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.outlineBtn,
        danger && { borderColor: c.danger + '40' },
        style,
      ]}
    >
      <Text style={[
        styles.outlineBtnText,
        danger && { color: c.danger },
      ]}>
        {label}
      </Text>
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
  const c = useThemeColors();
  const styles = useStyles(c);

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
  const c = useThemeColors();
  const styles = useStyles(c);

  return (
    <View style={styles.topbar}>
      <View style={styles.topbarSide}>{left}</View>

      <View style={styles.topbarCenter}>
        {title && <Text style={styles.topbarTitle} numberOfLines={1}>{title}</Text>}
        {subtitle && <Text style={styles.topbarSubtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>

      <View style={[styles.topbarSide, styles.topbarSideRight]}>{right}</View>
    </View>
  );
}

// ── BackButton ────────────────────────────────────────────────────────────────
export function BackButton({ onPress }: { onPress: () => void }) {
  const c = useThemeColors();
  const styles = useStyles(c);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={styles.backBtn}>
      <Text style={styles.backBtnText}>‹</Text>
    </TouchableOpacity>
  );
}

// ── ScripturePill ─────────────────────────────────────────────────────────────
export function ScripturePill({ icon, label }: { icon: string; label: string }) {
  const c = useThemeColors();
  const styles = useStyles(c);

  return (
    <View style={styles.pill}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

// ── PremiumBadge ──────────────────────────────────────────────────────────────
export function PremiumBadge({ onPress }: { onPress: () => void }) {
  const c = useThemeColors();
  const styles = useStyles(c);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[c.gold, c.goldBright]}
        style={styles.premiumBadge}
      >
        <Text style={styles.premiumText}>✦ PREMIUM</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
export function SectionLabel({ label }: { label: string }) {
  const c = useThemeColors();
  const styles = useStyles(c);

  return <Text style={styles.sectionLabel}>{label}</Text>;
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  const c = useThemeColors();
  const styles = useStyles(c);

  return <View style={[styles.divider, style]} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────
function useStyles(c: ThemeColors) {
  return StyleSheet.create({

    goldBtn: {
      paddingVertical: 15,
      paddingHorizontal: 28,
      borderRadius: Radius.sm,
      alignItems: 'center',
    },

    goldBtnText: {
      fontFamily: Fonts.cinzelBold,
      fontSize: FontSize.sm,
      letterSpacing: 2,
      color: c.bg0,
    },

    outlineBtn: {
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: Radius.sm,
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: c.goldBorder,
    },

    outlineBtnText: {
      fontFamily: Fonts.cinzel,
      fontSize: FontSize.xs,
      letterSpacing: 2,
      color: c.text1,
    },

    ghostBtn: {
      paddingVertical: 8,
      alignItems: 'center',
    },

    ghostBtnText: {
      fontFamily: Fonts.garamond,
      fontSize: FontSize.md,
      color: c.text2,
    },

    topbar: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      backgroundColor: c.bg0,
      borderBottomWidth: 0.5,
      borderBottomColor: c.goldBorder,
    },

    topbarSide: {
      width: 52,
      justifyContent: 'center',
    },

    topbarSideRight: {
      alignItems: 'flex-end',
    },

    topbarCenter: {
      flex: 1,
      alignItems: 'center',
    },

    topbarTitle: {
      fontFamily: Fonts.cinzel,
      fontSize: 12,
      letterSpacing: 3,
      color: c.text0,
    },

    topbarSubtitle: {
      fontFamily: Fonts.garamondItalic,
      fontSize: 11,
      color: c.text2,
    },

    backBtn: {
      padding: 4,
      marginLeft: -4,
    },

    backBtnText: {
      fontFamily: Fonts.garamond,
      fontSize: 28,
      color: c.text1,
    },

    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: Radius.full,
      backgroundColor: c.bg3,
      borderWidth: 0.5,
      borderColor: c.goldBorder,
    },

    pillIcon: {
      fontSize: 12,
    },

    pillText: {
      fontFamily: Fonts.garamond,
      fontSize: 12,
      color: c.text1,
    },

    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: Radius.full,
    },

    premiumText: {
      fontFamily: Fonts.cinzel,
      fontSize: 10,
      letterSpacing: 1.5,
      color: c.bg0,
    },

    sectionLabel: {
      fontFamily: Fonts.garamond,
      fontSize: FontSize.xs,
      letterSpacing: 2.5,
      textTransform: 'uppercase',
      color: c.text2,
      marginBottom: 12,
    },

    divider: {
      height: 0.5,
      backgroundColor: c.goldBorder,
    },

  });
}