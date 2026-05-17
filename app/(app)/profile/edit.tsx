// app/(app)/profile/edit.tsx
import { useState, useMemo } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/lib/api';
import { Topbar, BackButton } from '@/components/UI';
import { useThemeColors, ThemeColors, Fonts, FontSize, Spacing, Radius } from '@/theme';

type Scripture = 'gita' | 'ramayana' | 'mahabharata' | 'all';

const SCRIPTURE_OPTIONS: { value: Scripture; label: string; sym: string }[] = [
  { value: 'all',         label: 'All Scriptures', sym: 'ॐ'  },
  { value: 'gita',        label: 'Bhagavad Gita',  sym: 'ॐ'  },
  { value: 'ramayana',    label: 'Ramayana',        sym: '◈'  },
  { value: 'mahabharata', label: 'Mahabharata',     sym: '✦'  },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [preferredScripture, setPreferredScripture] = useState<Scripture>(
    (user?.preferences.preferredScripture as Scripture) ?? 'all'
  );
  const [saving, setSaving] = useState(false);

  const nameChanged = displayName.trim() !== (user?.displayName ?? '');
  const scriptureChanged = preferredScripture !== user?.preferences.preferredScripture;
  const hasChanges = nameChanged || scriptureChanged;

  async function handleSave() {
    if (!user || !hasChanges || saving) return;

    const trimmedName = displayName.trim();
    if (nameChanged && trimmedName.length < 1) {
      Alert.alert('Invalid name', 'Display name cannot be empty.');
      return;
    }

    setSaving(true);

    // Optimistic update
    const prevUser = user;
    setUser({
      ...user,
      displayName: nameChanged ? trimmedName : user.displayName,
      preferences: {
        ...user.preferences,
        preferredScripture: scriptureChanged ? preferredScripture : user.preferences.preferredScripture,
      },
    });

    try {
      await userApi.updateMe({
        ...(nameChanged ? { displayName: trimmedName } : {}),
        ...(scriptureChanged ? { preferences: { preferredScripture } } : {}),
      });
      router.back();
    } catch (err: any) {
      // Revert on failure
      setUser(prevUser);
      Alert.alert('Error', err?.message ?? 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Topbar
        title="Edit Profile"
        left={<BackButton onPress={() => router.back()} />}
        right={
          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges || saving}
            activeOpacity={0.7}
            style={styles.saveBtn}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <Text style={[styles.saveBtnText, (!hasChanges) && styles.saveBtnDisabled]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Display Name ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DISPLAY NAME</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.goldBorder }]}>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={colors.text2}
                maxLength={50}
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
            <Text style={styles.hint}>{displayName.trim().length} / 50</Text>
          </View>

          {/* ── Email (read-only) ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EMAIL</Text>
            <View style={[styles.inputWrapper, styles.inputReadOnly, { borderColor: colors.goldBorder }]}>
              <Text style={styles.inputReadOnlyText}>{user?.email ?? '—'}</Text>
            </View>
            <Text style={styles.hint}>Email cannot be changed here.</Text>
          </View>

          {/* ── Preferred Scripture ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PREFERRED SCRIPTURE</Text>
            <Text style={styles.sectionSub}>Sets the default scripture when starting a new chat.</Text>
            <View style={styles.optionsGrid}>
              {SCRIPTURE_OPTIONS.map((opt) => {
                const selected = preferredScripture === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionCard,
                      { borderColor: selected ? colors.gold : colors.goldBorder },
                      selected && styles.optionCardSelected,
                    ]}
                    onPress={() => setPreferredScripture(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionSym, { color: selected ? colors.gold : colors.text2 }]}>
                      {opt.sym}
                    </Text>
                    <Text style={[styles.optionLabel, { color: selected ? colors.gold : colors.text1 }]}>
                      {opt.label}
                    </Text>
                    {selected && (
                      <View style={[styles.optionCheck, { backgroundColor: colors.gold }]}>
                        <Text style={styles.optionCheckMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function useStyles(c: ThemeColors) {
  return useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg0 },
    scroll: { padding: Spacing.xl, gap: 28, paddingBottom: 60 },

    saveBtn: { paddingHorizontal: 4, paddingVertical: 6 },
    saveBtnText: { fontFamily: Fonts.cinzel, fontSize: 12, color: c.gold, letterSpacing: 1 },
    saveBtnDisabled: { opacity: 0.3 },

    section: { gap: 10 },
    sectionLabel: {
      fontFamily: Fonts.cinzel, fontSize: 9, color: c.text2,
      letterSpacing: 2.5, textTransform: 'uppercase',
    },
    sectionSub: {
      fontFamily: Fonts.garamond, fontSize: FontSize.sm, color: c.text2,
      marginTop: -4,
    },
    hint: {
      fontFamily: Fonts.garamond, fontSize: 11, color: c.text2,
      textAlign: 'right',
    },

    inputWrapper: {
      borderWidth: 0.5, borderRadius: Radius.md,
      backgroundColor: c.bg2, paddingHorizontal: 14,
    },
    input: {
      fontFamily: Fonts.garamond, fontSize: FontSize.md,
      color: c.text0, paddingVertical: 13,
    },
    inputReadOnly: { opacity: 0.6 },
    inputReadOnlyText: {
      fontFamily: Fonts.garamond, fontSize: FontSize.md,
      color: c.text1, paddingVertical: 13,
    },

    optionsGrid: { gap: 10 },
    optionCard: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 0.5, borderRadius: Radius.md,
      backgroundColor: c.bg2,
      paddingHorizontal: 16, paddingVertical: 14,
      gap: 12,
    },
    optionCardSelected: {
      backgroundColor: `${c.gold}0A`,
    },
    optionSym: {
      fontFamily: Fonts.cinzel, fontSize: 16, width: 22, textAlign: 'center',
    },
    optionLabel: {
      flex: 1, fontFamily: Fonts.garamond, fontSize: FontSize.md,
    },
    optionCheck: {
      width: 18, height: 18, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center',
    },
    optionCheckMark: {
      fontFamily: Fonts.cinzel, fontSize: 10, color: c.bg0,
    },
  }), [c]);
}
