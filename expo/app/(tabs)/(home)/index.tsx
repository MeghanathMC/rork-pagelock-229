import React, { useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius } from "@/constants/theme";
import { useAppState } from "@/providers/AppProvider";
import { Flame, BookOpen, Lock, Unlock, ChevronRight, Target } from "lucide-react-native";

const LOCKABLE_APPS: Record<string, { label: string; emoji: string }> = {
  instagram: { label: "Instagram", emoji: "📸" },
  youtube: { label: "YouTube", emoji: "▶️" },
  twitter: { label: "Twitter / X", emoji: "🐦" },
  reddit: { label: "Reddit", emoji: "🤖" },
  tiktok: { label: "TikTok", emoji: "🎵" },
  facebook: { label: "Facebook", emoji: "👍" },
  snapchat: { label: "Snapchat", emoji: "👻" },
  threads: { label: "Threads", emoji: "🧵" },
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hasCompletedOnboarding, isAuthenticated, isLoading, profile, streak, todayCompleted } = useAppState();

  const hasBook = profile.currentBookTitle.trim().length > 0;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;

  const progress = profile.totalPages > 0
    ? Math.min(profile.dailyPageGoal / profile.totalPages, 1)
    : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1200,
      delay: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    Animated.timing(statusAnim, {
      toValue: todayCompleted ? 1 : 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [todayCompleted, statusAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    if (!todayCompleted) loop.start();
    else {
      loop.stop();
      pulseAnim.setValue(1);
    }
    return () => loop.stop();
  }, [todayCompleted, pulseAnim]);

  useEffect(() => {
    if (isLoading) return;
    if (!hasCompletedOnboarding) {
      router.replace("/onboarding");
    } else if (!isAuthenticated) {
      router.replace("/auth");
    } else if (!hasBook) {
      router.replace("/book-setup");
    }
  }, [hasCompletedOnboarding, isAuthenticated, isLoading, hasBook, router]);

  const handleVerify = useCallback(() => {
    router.push("/verification");
  }, [router]);

  if (isLoading || !hasCompletedOnboarding || !isAuthenticated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!hasBook) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const statusBg = statusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(224, 85, 85, 0.12)", "rgba(76, 175, 130, 0.12)"],
  });

  const statusBorder = statusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.locked, colors.unlocked],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const pctDone = profile.totalPages > 0
    ? Math.round((profile.dailyPageGoal / profile.totalPages) * 100)
    : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.huge }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.headerTitle}>PageLock</Text>
        </View>
        <View style={styles.streakBadge}>
          <Flame size={18} color={streak.currentStreak > 0 ? colors.accent : colors.textMuted} />
          <Text style={[styles.streakCount, streak.currentStreak > 0 && styles.streakCountActive]}>
            {streak.currentStreak}
          </Text>
        </View>
      </View>

      <Animated.View style={[styles.statusCard, { backgroundColor: statusBg, borderColor: statusBorder }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          {todayCompleted ? (
            <Unlock size={32} color={colors.unlocked} strokeWidth={2} />
          ) : (
            <Lock size={32} color={colors.locked} strokeWidth={2} />
          )}
        </Animated.View>
        <View style={styles.statusTextBlock}>
          <Text style={[styles.statusLabel, { color: todayCompleted ? colors.unlocked : colors.locked }]}>
            {todayCompleted ? "APPS UNLOCKED" : "APPS LOCKED"}
          </Text>
          <Text style={styles.statusSub}>
            {todayCompleted
              ? "You've hit your reading goal today!"
              : `Read ${profile.dailyPageGoal} pages to unlock`}
          </Text>
        </View>
      </Animated.View>

      <View style={styles.bookCard} testID="book-card">
        <View style={styles.bookCardHeader}>
          <BookOpen size={16} color={colors.accent} />
          <Text style={styles.bookCardLabel}>NOW READING</Text>
        </View>
        <Text style={styles.bookTitle} numberOfLines={2}>{profile.currentBookTitle}</Text>
        {profile.currentBookAuthor.length > 0 && (
          <Text style={styles.bookAuthor} numberOfLines={1}>{profile.currentBookAuthor}</Text>
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Daily goal</Text>
            <Text style={styles.progressValue}>
              <Text style={styles.progressValueAccent}>{profile.dailyPageGoal}</Text>
              {" / "}{profile.totalPages} pages
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth }]}
            />
          </View>
          <Text style={styles.progressPct}>{pctDone}% of book as today's goal</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={[styles.statCard, styles.statCardMiddle]}>
          <Text style={styles.statValue}>{streak.longestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Target size={16} color={colors.accent} style={{ marginBottom: 4 }} />
          <Text style={styles.statLabel}>{profile.dailyPageGoal} pg/day</Text>
        </View>
      </View>

      {!todayCompleted && (
        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={handleVerify}
          activeOpacity={0.85}
          testID="verify-reading-btn"
        >
          <BookOpen size={20} color={colors.background} strokeWidth={2.5} />
          <Text style={styles.verifyBtnText}>Log Today's Reading</Text>
          <ChevronRight size={18} color={colors.background} />
        </TouchableOpacity>
      )}

      {todayCompleted && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedEmoji}>🎉</Text>
          <Text style={styles.completedText}>Great job! Come back tomorrow.</Text>
        </View>
      )}

      {profile.lockedApps.length > 0 && (
        <View style={styles.appsSection}>
          <View style={styles.appsSectionHeader}>
            <Text style={styles.appsSectionTitle}>MONITORED APPS</Text>
            <View style={[styles.appStatusPill, { backgroundColor: todayCompleted ? "rgba(76,175,130,0.15)" : "rgba(224,85,85,0.15)" }]}>
              <View style={[styles.appStatusDot, { backgroundColor: todayCompleted ? colors.unlocked : colors.locked }]} />
              <Text style={[styles.appStatusText, { color: todayCompleted ? colors.unlocked : colors.locked }]}>
                {todayCompleted ? "Unlocked" : "Locked"}
              </Text>
            </View>
          </View>
          <View style={styles.appsGrid}>
            {profile.lockedApps.map((appId) => {
              const app = LOCKABLE_APPS[appId];
              if (!app) return null;
              return (
                <View
                  key={appId}
                  style={[styles.appChip, todayCompleted && styles.appChipUnlocked]}
                  testID={`app-status-${appId}`}
                >
                  <Text style={styles.appChipEmoji}>{app.emoji}</Text>
                  <Text style={styles.appChipLabel}>{app.label}</Text>
                  {todayCompleted
                    ? <Unlock size={11} color={colors.unlocked} strokeWidth={2.5} />
                    : <Lock size={11} color={colors.locked} strokeWidth={2.5} />
                  }
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakCount: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.textMuted,
  },
  streakCountActive: {
    color: colors.accent,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.xl,
  },
  statusTextBlock: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "800" as const,
    letterSpacing: 1.2,
  },
  statusSub: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.textSecondary,
    marginTop: 3,
  },
  bookCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  bookCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bookCardLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.accent,
    letterSpacing: 1.2,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  bookAuthor: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.textMuted,
    marginTop: -spacing.xs,
  },
  progressSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },
  progressValueAccent: {
    color: colors.accent,
    fontWeight: "700" as const,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  progressPct: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    gap: 3,
  },
  statCardMiddle: {
    borderColor: "rgba(245, 166, 35, 0.2)",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: colors.accent,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: colors.textMuted,
    textAlign: "center",
  },
  verifyBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.background,
    letterSpacing: 0.2,
    flex: 1,
    textAlign: "center",
    marginLeft: spacing.xs,
  },
  completedBanner: {
    backgroundColor: "rgba(76,175,130,0.1)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(76,175,130,0.25)",
    padding: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  completedEmoji: {
    fontSize: 24,
  },
  completedText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.unlocked,
    flex: 1,
  },
  appsSection: {
    gap: spacing.md,
  },
  appsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appsSectionTitle: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  appStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  appStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  appStatusText: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.4,
  },
  appsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  appChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: "rgba(224,85,85,0.08)",
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(224,85,85,0.2)",
  },
  appChipUnlocked: {
    backgroundColor: "rgba(76,175,130,0.08)",
    borderColor: "rgba(76,175,130,0.2)",
  },
  appChipEmoji: {
    fontSize: 14,
  },
  appChipLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
});
