import { useState, useMemo } from 'react';
import {
  View, Text, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordReset } from '@/lib/auth';
import { GoldButton, BackButton, Topbar } from '@/components/UI';
import { useThemeColors, ThemeColors, Fonts, FontSize, Spacing } from '@/theme';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const { control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await sendPasswordReset(data.email);
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Topbar left={<BackButton onPress={() => router.back()} />} />
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✉</Text>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successSubtitle}>
            We've sent a password reset link to your email address.
          </Text>
          <GoldButton label="BACK TO SIGN IN" onPress={() => router.push('/(auth)/sign-in')} style={{ marginTop: 28 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Topbar
          left={<BackButton onPress={() => router.back()} />}
          title="Reset Password"
        />
        <View style={styles.content}>
          <View style={{ marginBottom: 28 }}>
            <Text style={styles.formTitle}>Forgot your password?</Text>
            <Text style={styles.formSubtitle}>Enter your email and we'll send you a reset link.</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.text2}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          <GoldButton
            label={isSubmitting ? '' : 'SEND RESET LINK'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={{ marginTop: 24 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function useStyles(c: ThemeColors) {
  return useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg1 },
    content: { flex: 1, padding: Spacing.xl, paddingTop: 36 },
    successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
    successIcon: { fontFamily: Fonts.cinzel, fontSize: 48, color: c.gold, marginBottom: 24 },
    successTitle: { fontFamily: Fonts.cinzel, fontSize: 24, color: c.text0, letterSpacing: 1.5, marginBottom: 12, textAlign: 'center' },
    successSubtitle: { fontFamily: Fonts.garamond, fontSize: FontSize.base, color: c.text1, textAlign: 'center', lineHeight: 26 },
    formTitle: { fontFamily: Fonts.cinzel, fontSize: 24, color: c.text0, letterSpacing: 1.5, marginBottom: 8 },
    formSubtitle: { fontFamily: Fonts.garamond, fontSize: FontSize.base, color: c.text1, lineHeight: 26 },
    field: { gap: 7 },
    fieldLabel: { fontFamily: Fonts.garamond, fontSize: FontSize.xs, letterSpacing: 2, textTransform: 'uppercase', color: c.text2 },
    input: {
      backgroundColor: c.bg2, borderWidth: 0.5, borderColor: c.goldBorder,
      borderRadius: 3, paddingHorizontal: 16, paddingVertical: 14,
      fontFamily: Fonts.garamond, fontSize: FontSize.base, color: c.text0,
    },
    errorText: { fontFamily: Fonts.garamond, fontSize: 12, color: c.danger, marginTop: 4 },
  }), [c]);
}
