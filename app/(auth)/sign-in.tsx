import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmail, signInWithGoogleToken } from '@/lib/auth';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import { useAuthStore } from '@/store/authStore';
import { GoldButton, BackButton, Topbar } from '@/components/UI';
import { Colors, Fonts, FontSize, Spacing } from '@/theme';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function SignInScreen() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { response, promptAsync, redirectUri } = useGoogleSignIn();

  const { control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      setGoogleLoading(true);
      signInWithGoogleToken(response.authentication.idToken)
        .catch((err: any) => Alert.alert('Google Sign In Failed', err.message))
        .finally(() => setGoogleLoading(false));
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign In Failed', response.error?.message ?? 'Unknown error');
    }
  }, [response]);

  async function onSubmit(data: FormData) {
    try {
      await signInWithEmail(data.email, data.password);
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Topbar
          left={<BackButton onPress={() => router.back()} />}
          title="Sign In"
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={{ marginBottom: 28 }}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSubtitle}>Continue your journey through sacred scripture.</Text>
          </View>

          {/* Google */}
          {__DEV__ && (
            <TouchableOpacity onLongPress={() => Alert.alert('OAuth Redirect URI', redirectUri)} style={{ marginBottom: 4 }}>
              <Text style={{ fontFamily: Fonts.garamond, fontSize: 10, color: Colors.text2, textAlign: 'center' }}>
                Long-press to see OAuth redirect URI
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()} disabled={googleLoading}>
            {googleLoading
              ? <ActivityIndicator size="small" color={Colors.gold} />
              : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
              )
            }
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.fieldGroup}>
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
                    placeholderTextColor={Colors.text2}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.text2}
                    secureTextEntry
                  />
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>
          </View>

          <TouchableOpacity style={styles.forgotRow} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <GoldButton
            label={isSubmitting || authLoading ? '' : 'CONTINUE'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting || authLoading}
            style={{ marginTop: 8 }}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>New here? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={[styles.switchText, { color: Colors.gold }]}>Create account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg1 },
  content: { flexGrow: 1, padding: Spacing.xl, paddingTop: 36 },
  formTitle: { fontFamily: Fonts.cinzel, fontSize: 24, color: Colors.text0, letterSpacing: 1.5, marginBottom: 8 },
  formSubtitle: { fontFamily: Fonts.garamond, fontSize: FontSize.base, color: Colors.text1, lineHeight: 26 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg2, borderWidth: 0.5, borderColor: Colors.goldBorder,
    borderRadius: 3, paddingVertical: 14, marginBottom: 20, gap: 12,
  },
  googleIcon: { fontFamily: Fonts.cinzelBold, fontSize: 16, color: Colors.text0 },
  googleText: { fontFamily: Fonts.garamond, fontSize: FontSize.base, color: Colors.text0 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: Colors.goldBorder },
  dividerText: { fontFamily: Fonts.garamond, fontSize: 13, color: Colors.text2 },
  fieldGroup: { gap: 16, marginBottom: 8 },
  field: { gap: 7 },
  fieldLabel: { fontFamily: Fonts.garamond, fontSize: FontSize.xs, letterSpacing: 2, textTransform: 'uppercase', color: Colors.text2 },
  input: {
    backgroundColor: Colors.bg2, borderWidth: 0.5, borderColor: Colors.goldBorder,
    borderRadius: 3, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: Fonts.garamond, fontSize: FontSize.base, color: Colors.text0,
  },
  errorText: { fontFamily: Fonts.garamond, fontSize: 12, color: Colors.danger, marginTop: 4 },
  forgotRow: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 4 },
  forgotText: { fontFamily: Fonts.garamond, fontSize: FontSize.sm, color: Colors.gold },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { fontFamily: Fonts.garamond, fontSize: FontSize.md, color: Colors.text2 },
});
