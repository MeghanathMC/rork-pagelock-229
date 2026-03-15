import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BookOpen } from "lucide-react-native";
import { GoogleSignin, isSuccessResponse, statusCodes } from "@react-native-google-signin/google-signin";
import { colors, spacing, radius, typography } from "@/constants/theme";
import { useAppState } from "@/providers/AppProvider";
import { supabase } from "@/lib/supabase";

export default function AuthScreen() {
  const router = useRouter();
  const { setAuthenticated } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, logoScale]);

  const handleGoogleAuth = useCallback(async () => {
    if (Platform.OS === "web") {
      setError("Google Sign-In is available on the mobile app. Please use the Android or iOS app.");
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsLoading(true);
    setError(null);

    try {
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices();
      }

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        if (!idToken) {
          setError("Could not get sign-in credentials. Please try again.");
          return;
        }

        const { error: supabaseError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });

        if (supabaseError) {
          console.error("[Auth] Supabase signInWithIdToken error:", supabaseError);
          setError(supabaseError.message ?? "Sign-in failed. Please try again.");
          return;
        }

        setAuthenticated(true);
        router.replace("/paywall");
      } else {
        const res = response as { type?: string };
        if (res.type === "cancelled") {
          return;
        }
        if (res.type === "noSavedCredentialFound") {
          setError("No Google account found. Please add an account in your device settings.");
          return;
        }
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError("Google Play Services is not available or outdated.");
        return;
      }
      if (code === statusCodes.IN_PROGRESS) {
        return;
      }
      console.error("[Auth] Google Sign-In error:", err);
      setError("Sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [setAuthenticated, router]);

  const handleTerms = useCallback(() => {
    void Linking.openURL("https://example.com/terms");
  }, []);

  const handlePrivacy = useCallback(() => {
    void Linking.openURL("https://example.com/privacy");
  }, []);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["transparent", "rgba(245, 166, 35, 0.02)", "rgba(245, 166, 35, 0.05)"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoArea,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <BookOpen color={colors.accent} size={40} strokeWidth={1.8} />
            </View>
            <Text style={styles.appName}>PageLock</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.googleButton, isLoading && styles.buttonDisabled]}
              onPress={handleGoogleAuth}
              activeOpacity={0.85}
              disabled={isLoading}
              testID="auth-google"
            >
              <LinearGradient
                colors={[colors.accent, colors.accentDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleText}>Continue with Google</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{" "}
              <Text style={styles.legalLink} onPress={handleTerms}>
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text style={styles.legalLink} onPress={handlePrivacy}>
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxxl,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 166, 35, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 166, 35, 0.2)",
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  googleButton: {
    borderRadius: radius.md,
    overflow: "hidden",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.background,
  },
  googleText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.background,
  },
  errorBanner: {
    backgroundColor: "rgba(224, 85, 85, 0.12)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(224, 85, 85, 0.25)",
    padding: spacing.md,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    textAlign: "center",
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: spacing.lg,
  },
  legalText: {
    ...typography.small,
    textAlign: "center",
    lineHeight: 18,
    color: colors.textMuted,
  },
  legalLink: {
    color: colors.textSecondary,
    textDecorationLine: "underline" as const,
  },
});
