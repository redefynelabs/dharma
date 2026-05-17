import { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors, ThemeColors, Fonts, FontSize, Spacing, Radius } from '@/theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity activeOpacity={1} style={styles.container}>
          {/* Decorative top bar */}
          <View style={styles.topBar} />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.divider} />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <View style={styles.btnDivider} />

            <TouchableOpacity
              style={[styles.confirmBtn, destructive && styles.confirmBtnDanger]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.confirmText, destructive && styles.confirmTextDanger]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function useStyles(c: ThemeColors) {
  return useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(8,7,5,0.88)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    container: {
      width: '100%',
      backgroundColor: c.bg2,
      borderRadius: Radius.lg,
      borderWidth: 0.5,
      borderColor: c.goldBorder,
      overflow: 'hidden',
    },
    topBar: {
      height: 1.5,
      backgroundColor: c.gold,
      opacity: 0.35,
    },
    title: {
      fontFamily: Fonts.cinzelBold,
      fontSize: FontSize.base,
      color: c.text0,
      letterSpacing: 0.5,
      textAlign: 'center',
      paddingTop: Spacing.xl,
      paddingHorizontal: Spacing.xl,
    },
    message: {
      fontFamily: Fonts.garamondItalic,
      fontSize: FontSize.md,
      color: c.text1,
      textAlign: 'center',
      lineHeight: 24,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
      paddingHorizontal: Spacing.xl,
    },
    divider: {
      height: 0.5,
      backgroundColor: c.goldBorder,
      marginHorizontal: 0,
    },
    buttons: {
      flexDirection: 'row',
      height: 52,
    },
    cancelBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontFamily: Fonts.cinzel,
      fontSize: FontSize.sm,
      color: c.text2,
      letterSpacing: 0.5,
    },
    btnDivider: {
      width: 0.5,
      backgroundColor: c.goldBorder,
    },
    confirmBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBtnDanger: {
      // no background change, just text color
    },
    confirmText: {
      fontFamily: Fonts.cinzel,
      fontSize: FontSize.sm,
      color: c.gold,
      letterSpacing: 0.5,
    },
    confirmTextDanger: {
      color: c.danger,
    },
  }), [c]);
}
