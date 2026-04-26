import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/lib/api';
import { Topbar, BackButton } from '@/components/UI';
import { Colors, Fonts, FontSize, Spacing, Radius } from '@/theme';

const SECTIONS = [
  {
    index: '01',
    title: 'Data We Collect',
    body: 'Dharma collects your email address and display name to create and manage your account. We also store your conversation history, usage statistics, and in-app preferences.',
  },
  {
    index: '02',
    title: 'How We Use Your Data',
    body: 'Your data is used solely to provide and improve the Dharma experience — personalising your journey, powering the AI guide, and saving your preferences. We do not sell, rent, or share your personal data with third parties.',
  },
  {
    index: '03',
    title: 'Data Storage & Security',
    body: 'All data is stored securely with industry-standard encryption at rest and in transit. Access is strictly limited to authenticated services.',
  },
  {
    index: '04',
    title: 'AI Interactions',
    body: 'Your questions are processed to generate responses grounded in scripture. Conversations are saved to your account so you can revisit them. You may delete individual sessions at any time from the Wisdom tab.',
  },
  {
    index: '05',
    title: 'Your Rights',
    body: 'You have the right to access, correct, or delete your personal data at any time. Deleting your account permanently erases all associated data within 30 days.',
  },
  {
    index: '06',
    title: 'Contact',
    body: "For privacy-related questions or data requests, please reach out through the app's support channel. We aim to respond within 72 hours.",
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try { await userApi.deleteMe(); setUser(null); }
            catch (err: any) { Alert.alert('Error', err.message); }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar left={<BackButton onPress={() => router.back()} />} title="Privacy & Data" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header summary ──────────────────────────── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summarySymbol}>◎</Text>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>Your data, your control</Text>
            <Text style={styles.summaryBody}>
              We collect only what is needed to run Dharma. We never sell your data.
            </Text>
          </View>
        </View>

        {/* ── Policy sections ─────────────────────────── */}
        <View style={styles.card}>
          {SECTIONS.map((s, i) => (
            <View key={s.index}>
              <View style={styles.policyRow}>
                <Text style={styles.policyIndex}>{s.index}</Text>
                <View style={styles.policyContent}>
                  <Text style={styles.policyTitle}>{s.title}</Text>
                  <Text style={styles.policyBody}>{s.body}</Text>
                </View>
              </View>
              {i < SECTIONS.length - 1 && <View style={styles.sep} />}
            </View>
          ))}
        </View>

        {/* ── Delete account ──────────────────────────── */}
        <View style={styles.dangerCard}>
          <View style={styles.dangerHeader}>
            <Text style={styles.dangerTitle}>Delete Account</Text>
            <View style={styles.dangerBadge}>
              <Text style={styles.dangerBadgeText}>IRREVERSIBLE</Text>
            </View>
          </View>
          <Text style={styles.dangerBody}>
            Permanently removes your account and all associated data including conversation history,
            preferences, and usage records. This action cannot be undone.
          </Text>
          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={styles.dangerBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.dangerBtnText}>Delete My Account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg0 },
  scroll: { padding: Spacing.xl, paddingBottom: 60, gap: 12 },

  // Summary card
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.bg2,
    borderWidth: 0.5, borderColor: Colors.goldBorder,
    borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: 4,
  },
  summarySymbol: {
    fontFamily: Fonts.cinzel, fontSize: 22, color: Colors.gold,
    width: 32, textAlign: 'center',
  },
  summaryText: { flex: 1 },
  summaryTitle: {
    fontFamily: Fonts.cinzel, fontSize: FontSize.sm,
    color: Colors.text0, letterSpacing: 0.3, marginBottom: 4,
  },
  summaryBody: {
    fontFamily: Fonts.garamond, fontSize: FontSize.sm,
    color: Colors.text2, lineHeight: 19,
  },

  // Policy card
  card: {
    backgroundColor: Colors.bg2, borderWidth: 0.5, borderColor: Colors.goldBorder,
    borderRadius: Radius.lg, overflow: 'hidden',
  },
  policyRow: {
    flexDirection: 'row', gap: 14,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  policyIndex: {
    fontFamily: Fonts.cinzel, fontSize: 10,
    color: Colors.goldDim, letterSpacing: 0.5,
    marginTop: 2, width: 20,
  },
  policyContent: { flex: 1 },
  policyTitle: {
    fontFamily: Fonts.cinzel, fontSize: FontSize.sm,
    color: Colors.gold, letterSpacing: 0.3, marginBottom: 6,
  },
  policyBody: {
    fontFamily: Fonts.garamond, fontSize: FontSize.sm,
    color: Colors.text1, lineHeight: 22,
  },
  sep: {
    height: 0.5, backgroundColor: 'rgba(200,137,42,0.07)',
    marginHorizontal: Spacing.lg,
  },

  // Danger card
  dangerCard: {
    marginTop: 8,
    backgroundColor: 'rgba(192,57,43,0.04)',
    borderWidth: 0.5, borderColor: 'rgba(192,57,43,0.2)',
    borderRadius: Radius.lg, padding: Spacing.xl,
  },
  dangerHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  dangerTitle: {
    fontFamily: Fonts.cinzel, fontSize: FontSize.sm,
    color: Colors.danger, letterSpacing: 0.5,
  },
  dangerBadge: {
    backgroundColor: 'rgba(192,57,43,0.12)',
    borderWidth: 0.5, borderColor: 'rgba(192,57,43,0.25)',
    borderRadius: Radius.sm, paddingHorizontal: 7, paddingVertical: 2,
  },
  dangerBadgeText: {
    fontFamily: Fonts.cinzel, fontSize: 8,
    color: Colors.danger, letterSpacing: 1.5,
  },
  dangerBody: {
    fontFamily: Fonts.garamond, fontSize: FontSize.sm,
    color: Colors.text2, lineHeight: 21, marginBottom: 18,
  },
  dangerBtn: {
    borderWidth: 1, borderColor: 'rgba(192,57,43,0.4)',
    borderRadius: Radius.md, paddingVertical: 13,
    alignItems: 'center', backgroundColor: 'rgba(192,57,43,0.06)',
  },
  dangerBtnText: {
    fontFamily: Fonts.cinzel, fontSize: FontSize.sm,
    color: Colors.danger, letterSpacing: 1,
  },
});
