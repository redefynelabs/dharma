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
import { signUpWithEmail, signInWithGoogleToken } from '@/lib/auth';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import { useAuthStore } from '@/store/authStore';
import { GoldButton, BackButton, Topbar } from '@/components/UI';
import { Colors, Fonts, FontSize, Spacing } from '@/theme';

const schema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

const FIELDS = [
  { name: 'displayName' as const, label: 'Your name', placeholder: 'Arjuna', secure: false, keyboard: 'default' as const },
  { name: 'email' as const, label: 'Email', placeholder: 'you@example.com', secure: false, keyboard: 'email-address' as const },
  { name: 'password' as const, label: 'Password', placeholder: 'Min. 8 characters', secure: true, keyboard: 'default' as const },
  { name: 'confirmPassword' as const, label: 'Confirm password', placeholder: '••••••••', secure: true, keyboard: 'default' as const },
];

export default function SignUpScreen() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { response, promptAsync } = useGoogleSignIn();

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
      await signUpWithEmail(data.email, data.password, data.displayName);
    } catch (err: any) {
      const message = err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : err.message;
      Alert.alert('Sign Up Failed', message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Topbar
          left={<BackButton onPress={() => router.back()} />}
          title="Create Account"
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={{ marginBottom: 28 }}>
            <Text style={styles.formTitle}>Begin your path</Text>
            <Text style={styles.formSubtitle}>Join the community of seekers of sacred wisdom.</Text>
          </View>

          {/* Google */}
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
            {FIELDS.map((field) => (
              <View key={field.name} style={styles.field}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Controller
                  control={control}
                  name={field.name}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder={field.placeholder}
                      placeholderTextColor={Colors.text2}
                      secureTextEntry={field.secure}
                      keyboardType={field.keyboard}
                      autoCapitalize={field.name === 'displayName' ? 'words' : 'none'}
                    />
                  )}
                />
                {errors[field.name] && (
                  <Text style={styles.errorText}>{errors[field.name]?.message}</Text>
                )}
              </View>
            ))}
          </View>

          <GoldButton
            label={isSubmitting || authLoading ? '' : 'CREATE ACCOUNT'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting || authLoading}
            style={{ marginTop: 8 }}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={[styles.switchText, { color: Colors.gold }]}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>By continuing you agree to our Terms of Service and Privacy Policy.</Text>
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
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { fontFamily: Fonts.garamond, fontSize: FontSize.md, color: Colors.text2 },
  legal: { fontFamily: Fonts.garamond, fontSize: 12, color: Colors.text2, textAlign: 'center', lineHeight: 18, marginTop: 16 },
});
