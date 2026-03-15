import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Crown, Infinity as InfinityIcon, Lock, Flame, Check, X } from "lucide-react-native";
import { colors, spacing, radius, typography } from "@/constants/theme";
import { useAppState } from "@/providers/AppProvider";
import { useMutation, useQuery } from "@tanstack/react-query";
import Purchases from "react-native-purchases";
import type { PurchasesPackage } from "react-native-purchases";

const FEATURES = [
  { icon: InfinityIcon, label: "Unlimited books" },
  { icon: Lock, label: "Lock any app" },
  { icon: Flame, label: "Streak recovery" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { setPro } = useAppState();
  const [selectedPlan, setSelectedPlan] = useState<"yearly" | "monthly">("yearly");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const crownScale = useRef(new Animated.Value(0.6)).current;
  const crownGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 45,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(crownScale, {
        toValue: 1,
        tension: 55,
        friction: 6,
        useNativeDriver: true,
        delay: 200,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(crownGlow, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(crownGlow, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, crownScale, crownGlow]);

  const offeringsQuery = useQuery({
    queryKey: ["offerings"],
    queryFn: async () => {
      const offerings = await Purchases.getOfferings();
      console.log("[Paywall] Offerings loaded:", JSON.stringify(offerings.current?.availablePackages?.map(p => p.identifier)));
      return offerings;
    },
  });

  const monthlyPackage = offeringsQuery.data?.current?.availablePackages?.find(
    (p) => p.packageType === "MONTHLY" || p.identifier === "$rc_monthly"
  );
  const yearlyPackage = offeringsQuery.data?.current?.availablePackages?.find(
    (p) => p.packageType === "ANNUAL" || p.identifier === "$rc_annual"
  );

  const selectedPackage: PurchasesPackage | undefined =
    selectedPlan === "yearly" ? yearlyPackage : monthlyPackage;

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const result = await Purchases.purchasePackage(pkg);
      console.log("[Paywall] Purchase success:", result.customerInfo.entitlements.active);
      return result;
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setPro(true);
      router.replace("/");
    },
    onError: (error: any) => {
      console.log("[Paywall] Purchase error:", error?.code, error?.message);
      if (error?.userCancelled || error?.code === "1") {
        return;
      }
      Alert.alert("Purchase Failed", "Something went wrong. Please try again.", [{ text: "OK" }]);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const result = await Purchases.restorePurchases();
      console.log("[Paywall] Restore result:", result.entitlements.active);
      return result;
    },
    onSuccess: (customerInfo) => {
      const hasPro = !!customerInfo.entitlements.active["pro"];
      if (hasPro) {
        setPro(true);
        if (Platform.OS !== "web") {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.replace("/");
      } else {
        Alert.alert("No Purchases Found", "We couldn't find any previous purchases to restore.", [{ text: "OK" }]);
      }
    },
    onError: (error: any) => {
      console.log("[Paywall] Restore error:", error?.message);
      Alert.alert("Restore Failed", "Could not restore purchases. Please try again.", [{ text: "OK" }]);
    },
  });

  const handlePurchase = useCallback(() => {
    if (!selectedPackage) return;
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    purchaseMutation.mutate(selectedPackage);
  }, [selectedPackage, purchaseMutation]);

  const handleRestore = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    restoreMutation.mutate();
  }, [restoreMutation]);

  const handleContinueFree = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace("/(tabs)/(home)");
  }, [router]);

  const handleSelectPlan = useCallback((plan: "yearly" | "monthly") => {
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    setSelectedPlan(plan);
  }, []);

  const monthlyPrice = monthlyPackage?.product?.priceString ?? "$5.00";
  const yearlyPrice = yearlyPackage?.product?.priceString ?? "$30.00";

  const crownGlowOpacity = crownGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.55],
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["rgba(245, 166, 35, 0.08)", colors.background, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleContinueFree}
          activeOpacity={0.7}
          testID="paywall-close"
        >
          <X color={colors.textMuted} size={20} />
        </TouchableOpacity>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View
            style={[
              styles.crownArea,
              { opacity: fadeAnim, transform: [{ scale: crownScale }] },
            ]}
          >
            <Animated.View
              style={[styles.crownGlow, { opacity: crownGlowOpacity }]}
            />
            <View style={styles.crownCircle}>
              <Crown color={colors.accent} size={40} strokeWidth={1.8} fill="rgba(245,166,35,0.15)" />
            </View>
          </Animated.View>

          <Animated.View
            style={[styles.headerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <Text style={styles.headline}>Read more. Scroll less.</Text>
            <Text style={styles.headlineAccent}>Go Pro.</Text>
            <Text style={styles.subline}>Unlock the full PageLock experience.</Text>
          </Animated.View>

          <Animated.View
            style={[styles.featuresCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {FEATURES.map(({ icon: Icon, label }) => (
              <View key={label} style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <Icon color={colors.accent} size={18} strokeWidth={2} />
                </View>
                <Text style={styles.featureLabel}>{label}</Text>
                <Check color={colors.success} size={16} strokeWidth={2.5} />
              </View>
            ))}
          </Animated.View>

          <Animated.View
            style={[styles.plansSection, { opacity: fadeAnim }]}
          >
            <TouchableOpacity
              style={[styles.planPill, selectedPlan === "yearly" && styles.planPillSelected]}
              onPress={() => handleSelectPlan("yearly")}
              activeOpacity={0.85}
              testID="paywall-plan-yearly"
            >
              {selectedPlan === "yearly" && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>BEST VALUE</Text>
                </View>
              )}
              <View style={styles.planContent}>
                <View>
                  <Text style={[styles.planTitle, selectedPlan === "yearly" && styles.planTitleSelected]}>
                    Yearly
                  </Text>
                  <Text style={styles.planPrice}>{yearlyPrice} / year</Text>
                </View>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>Save 50%</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planPill, selectedPlan === "monthly" && styles.planPillSelected]}
              onPress={() => handleSelectPlan("monthly")}
              activeOpacity={0.85}
              testID="paywall-plan-monthly"
            >
              <View style={styles.planContent}>
                <View>
                  <Text style={[styles.planTitle, selectedPlan === "monthly" && styles.planTitleSelected]}>
                    Monthly
                  </Text>
                  <Text style={styles.planPrice}>{monthlyPrice} / month</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.renewalNote, { opacity: fadeAnim }]}>
            <Text style={styles.renewalText}>
              Auto-renews. Cancel anytime in Google Play.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.ctaSection, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={[styles.ctaButton, (!selectedPackage || purchaseMutation.isPending) && styles.ctaButtonDisabled]}
              onPress={handlePurchase}
              activeOpacity={0.88}
              disabled={!selectedPackage || purchaseMutation.isPending}
              testID="paywall-subscribe"
            >
              <LinearGradient
                colors={[colors.accent, colors.accentDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                {purchaseMutation.isPending ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.ctaText}>Start PageLock Pro</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRestore}
              activeOpacity={0.7}
              disabled={restoreMutation.isPending}
              style={styles.textButton}
              testID="paywall-restore"
            >
              {restoreMutation.isPending ? (
                <ActivityIndicator color={colors.textMuted} size="small" />
              ) : (
                <Text style={styles.textButtonLabel}>Restore Purchases</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleContinueFree}
              activeOpacity={0.7}
              style={styles.textButton}
              testID="paywall-free"
            >
              <Text style={styles.freeButtonLabel}>Continue with Free</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => void Linking.openURL("https://example.com/privacy")}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity onPress={() => void Linking.openURL("https://example.com/terms")}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  closeButton: {
    position: "absolute",
    top: 56,
    right: spacing.xl,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  crownArea: {
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  crownGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent,
  },
  crownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 166, 35, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 166, 35, 0.3)",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: spacing.xxxl,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: colors.textPrimary,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  headlineAccent: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: colors.accent,
    letterSpacing: -0.6,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subline: {
    ...typography.body,
    textAlign: "center",
    color: colors.textSecondary,
  },
  featuresCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: "rgba(245, 166, 35, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500" as const,
    color: colors.textPrimary,
  },
  plansSection: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  planPill: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    overflow: "hidden",
  },
  planPillSelected: {
    borderColor: colors.accent,
    backgroundColor: "rgba(245, 166, 35, 0.06)",
  },
  planBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: colors.background,
    letterSpacing: 0.8,
  },
  planContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  planTitleSelected: {
    color: colors.textPrimary,
  },
  planPrice: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textMuted,
  },
  savingsBadge: {
    backgroundColor: "rgba(76, 175, 130, 0.15)",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 130, 0.3)",
  },
  savingsText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: colors.success,
  },
  renewalNote: {
    marginBottom: spacing.xxl,
  },
  renewalText: {
    ...typography.small,
    textAlign: "center",
    color: colors.textMuted,
    lineHeight: 18,
  },
  ctaSection: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  ctaButton: {
    borderRadius: radius.md,
    overflow: "hidden",
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: colors.background,
    letterSpacing: 0.2,
  },
  textButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  textButtonLabel: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textSecondary,
  },
  freeButtonLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  footerLink: {
    ...typography.small,
    color: colors.textMuted,
    textDecorationLine: "underline" as const,
  },
  footerDot: {
    ...typography.small,
    color: colors.textMuted,
  },
});
