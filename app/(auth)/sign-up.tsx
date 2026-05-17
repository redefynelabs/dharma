import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUpWithEmail, signInWithGoogleToken } from "@/lib/auth";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { useAuthStore } from "@/store/authStore";
import { GoldButton, BackButton, Topbar } from "@/components/UI";
import { useThemeColors, ThemeColors, Fonts, FontSize, Spacing } from "@/theme";
import { Eye, EyeOff } from "lucide-react-native";

const schema = z
  .object({
    displayName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof schema>;

const FIELDS = [
  {
    name: "displayName" as const,
    label: "Your name",
    placeholder: "Arjuna",
    secure: false,
    keyboard: "default" as const,
  },
  {
    name: "email" as const,
    label: "Email",
    placeholder: "you@example.com",
    secure: false,
    keyboard: "email-address" as const,
  },
  {
    name: "password" as const,
    label: "Password",
    placeholder: "Min. 8 characters",
    secure: true,
    keyboard: "default" as const,
  },
  {
    name: "confirmPassword" as const,
    label: "Confirm password",
    placeholder: "••••••••",
    secure: true,
    keyboard: "default" as const,
  },
];

function getReadableErrorMessage(error: any) {
  const code = error?.code || error?.message || "";

  if (code.includes("auth/email-already-in-use")) {
    return "A seeker with this email already walks this path. Try signing in instead.";
  }
  if (code.includes("auth/invalid-email")) {
    return "This email does not appear valid. Please enter it with care.";
  }
  if (code.includes("auth/weak-password")) {
    return "Your password is too weak. Strengthen it with at least 8 characters.";
  }
  if (code.includes("network")) {
    return "Your connection to the divine network is unstable. Please check your internet.";
  }

  return "Something unexpected occurred on your journey. Please try again.";
}

export default function SignUpScreen() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn: googleSignIn } = useGoogleSignIn();
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const idToken = await googleSignIn();
      if (idToken) await signInWithGoogleToken(idToken);
    } catch (err: any) {
      if (__DEV__) console.error('[GoogleSignIn] error:', err?.code, err?.message, err);
      if (err?.code === 'EXPO_GO') {
        setErrorMessage('Google Sign-In is not available in Expo Go. Please sign in with email, or use a development build.');
      } else if (String(err?.code) === '10' || err?.message?.includes('DEVELOPER_ERROR')) {
        setErrorMessage('Google Sign-In setup error: the app signing key is not registered in Google Cloud Console. Please contact support.');
      } else if (String(err?.code) === '12501') {
        // user cancelled — do nothing
      } else {
        setErrorMessage(getReadableErrorMessage(err));
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      await signUpWithEmail(data.email, data.password, data.displayName);
    } catch (err: any) {
      setErrorMessage(getReadableErrorMessage(err));
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Topbar
          left={<BackButton onPress={() => router.back()} />}
          title="Create Account"
        />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 140 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 28 }}>
            <Text style={styles.formTitle}>Begin your path</Text>
            <Text style={styles.formSubtitle}>
              Join the community of seekers of sacred wisdom.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
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
                    <View style={{ position: "relative" }}>
                      <TextInput
                        style={[
                          styles.input,
                          { paddingRight: field.secure ? 50 : 16 },
                        ]}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder={field.placeholder}
                        placeholderTextColor={colors.text2}
                        secureTextEntry={
                          field.name === "password"
                            ? !showPassword
                            : field.name === "confirmPassword"
                              ? !showConfirmPassword
                              : false
                        }
                        keyboardType={field.keyboard}
                        autoCapitalize={
                          field.name === "displayName" ? "words" : "none"
                        }
                      />

                      {field.secure && (
                        <TouchableOpacity
                          onPress={() => {
                            if (field.name === "password") {
                              setShowPassword((prev) => !prev);
                            } else if (field.name === "confirmPassword") {
                              setShowConfirmPassword((prev) => !prev);
                            }
                          }}
                          style={{
                            position: "absolute",
                            right: 16,
                            top: 0,
                            bottom: 0,
                            justifyContent: "center",
                          }}
                        >
                          {(
                            field.name === "password"
                              ? showPassword
                              : showConfirmPassword
                          ) ? (
                            <EyeOff size={18} color={colors.text2} />
                          ) : (
                            <Eye size={18} color={colors.text2} />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                />
                {errors[field.name] && (
                  <Text style={styles.errorText}>
                    {errors[field.name]?.message}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
              <Text style={[styles.switchText, { color: colors.gold }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>

        {/* FIXED BUTTON */}
        <View style={styles.bottomContainer}>
          <GoldButton
            label={isSubmitting || authLoading ? "" : "CREATE ACCOUNT"}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting || authLoading}
          />
        </View>

        {/* MODAL */}
        {errorMessage && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>⚜️ A Gentle Interruption</Text>
              <Text style={styles.modalText}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setErrorMessage(null)}
              >
                <Text style={styles.modalButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function useStyles(c: ThemeColors) {
  return useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: c.bg1 },
        content: { flexGrow: 1, padding: Spacing.xl, paddingTop: 36 },

        formTitle: {
          fontFamily: Fonts.cinzel,
          fontSize: 24,
          color: c.text0,
          letterSpacing: 1.5,
          marginBottom: 8,
        },
        formSubtitle: {
          fontFamily: Fonts.garamond,
          fontSize: FontSize.base,
          color: c.text1,
          lineHeight: 26,
        },

        googleBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.bg2,
          borderWidth: 0.5,
          borderColor: c.goldBorder,
          borderRadius: 3,
          paddingVertical: 14,
          marginBottom: 20,
          gap: 12,
        },

        googleIcon: {
          fontFamily: Fonts.cinzelBold,
          fontSize: 16,
          color: c.text0,
        },
        googleText: {
          fontFamily: Fonts.garamond,
          fontSize: FontSize.base,
          color: c.text0,
        },

        dividerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        },
        dividerLine: { flex: 1, height: 0.5, backgroundColor: c.goldBorder },
        dividerText: {
          fontFamily: Fonts.garamond,
          fontSize: 13,
          color: c.text2,
        },

        fieldGroup: { gap: 16, marginBottom: 8 },
        field: { gap: 7 },

        fieldLabel: {
          fontFamily: Fonts.garamond,
          fontSize: FontSize.xs,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: c.text2,
        },

        input: {
          backgroundColor: c.bg2,
          borderWidth: 0.5,
          borderColor: c.goldBorder,
          borderRadius: 3,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontFamily: Fonts.garamond,
          fontSize: FontSize.base,
          color: c.text0,
        },

        errorText: {
          fontFamily: Fonts.garamond,
          fontSize: 12,
          color: c.danger,
          marginTop: 4,
        },

        switchRow: {
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 20,
        },
        switchText: {
          fontFamily: Fonts.garamond,
          fontSize: FontSize.md,
          color: c.text2,
        },

        legal: {
          fontFamily: Fonts.garamond,
          fontSize: 12,
          color: c.text2,
          textAlign: "center",
          lineHeight: 18,
          marginTop: 16,
        },

        bottomContainer: {
          padding: 16,
          borderTopWidth: 0.5,
          borderColor: c.goldBorder,
          backgroundColor: c.bg1,
        },

        modalOverlay: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        },

        modalBox: {
          width: "100%",
          backgroundColor: c.bg1,
          borderRadius: 8,
          padding: 20,
          borderWidth: 0.5,
          borderColor: c.goldBorder,
        },

        modalTitle: {
          fontFamily: Fonts.cinzel,
          fontSize: 18,
          color: c.gold,
          marginBottom: 12,
          textAlign: "center",
        },

        modalText: {
          fontFamily: Fonts.garamond,
          fontSize: 14,
          color: c.text1,
          textAlign: "center",
          lineHeight: 22,
          marginBottom: 20,
        },

        modalButton: {
          backgroundColor: c.gold,
          paddingVertical: 12,
          borderRadius: 4,
          alignItems: "center",
        },

        modalButtonText: {
          fontFamily: Fonts.cinzelBold,
          color: c.bg1,
          fontSize: 14,
        },
      }),
    [c],
  );
}
