import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius } from "@/constants/theme";
import { useAppState } from "@/providers/AppProvider";
import {
  Flame,
  Trophy,
  BookOpen,
  CheckCircle2,
  XCircle,
  Calendar,
  TrendingUp,
  Zap,
} from "lucide-react-native";

function getDayLabel(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function buildCalendar(readingLogs: { date: string; passed: boolean }[]): {
  date: string;
  status: "completed" | "missed" | "future" | "today";
}[] {
  const logMap = new Map(readingLogs.map((l) => [l.date, l.passed]));
  const today = new Date();
  const result = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];
    if (dateStr === todayStr) {
      result.push({ date: dateStr, status: "today" as const });
    } else if (logMap.has(dateStr)) {
      result.push({ date: dateStr, status: logMap.get(dateStr) ? ("completed" as const) : ("missed" as const) });
    } else {
      result.push({ date: dateStr, status: "missed" as const });
    }
  }
  return result;
}

export default function StreaksScreen() {
  const insets = useSafeAreaInsets();
  const { streak, readingLogs, todayCompleted } = useAppState();

  const calendarDays = useMemo(
    () => buildCalendar(readingLogs),
    [readingLogs]
  );

  const totalCompleted = readingLogs.filter((l) => l.passed).length;
  const completionRate =
    readingLogs.length > 0
      ? Math.round((readingLogs.filter((l) => l.passed).length / readingLogs.length) * 100)
      : 0;

  const weekRows: (typeof calendarDays)[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weekRows.push(calendarDays.slice(i, i + 7));
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.huge },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen
        options={{
          title: "Streaks",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.heroRow}>
        <View style={styles.heroCard}>
          <View style={styles.heroFlameWrap}>
            <Flame
              size={28}
              color={streak.currentStreak > 0 ? colors.accent : colors.textMuted}
              fill={streak.currentStreak > 0 ? "rgba(245,166,35,0.2)" : "transparent"}
            />
          </View>
          <Text style={[styles.heroNum, streak.currentStreak > 0 && styles.heroNumActive]}>
            {streak.currentStreak}
          </Text>
          <Text style={styles.heroLabel}>Day Streak</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTrophyWrap}>
            <Trophy size={26} color="#FFD700" />
          </View>
          <Text style={[styles.heroNum, styles.heroNumGold]}>{streak.longestStreak}</Text>
          <Text style={styles.heroLabel}>Best Streak</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroZapWrap}>
            <Zap size={26} color={colors.success} />
          </View>
          <Text style={[styles.heroNum, styles.heroNumGreen]}>{completionRate}%</Text>
          <Text style={styles.heroLabel}>Completion</Text>
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <BookOpen size={14} color={colors.textMuted} />
          <Text style={styles.statItemText}>
            <Text style={styles.statItemVal}>{totalCompleted}</Text> days read
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Calendar size={14} color={colors.textMuted} />
          <Text style={styles.statItemText}>
            <Text style={styles.statItemVal}>{readingLogs.length}</Text> logged
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <TrendingUp size={14} color={colors.textMuted} />
          <Text style={styles.statItemText}>
            Last 28 days
          </Text>
        </View>
      </View>

      <View style={styles.calendarSection}>
        <Text style={styles.sectionLabel}>28-DAY ACTIVITY</Text>
        <View style={styles.calendarGrid}>
          {weekRows.map((week, wi) => (
            <View key={wi} style={styles.calendarRow}>
              {week.map((day) => (
                <View
                  key={day.date}
                  style={[
                    styles.calDot,
                    day.status === "completed" && styles.calDotCompleted,
                    day.status === "missed" && styles.calDotMissed,
                    day.status === "today" && (todayCompleted ? styles.calDotCompleted : styles.calDotToday),
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
        <View style={styles.calLegend}>
          <View style={styles.calLegendItem}>
            <View style={[styles.calDot, styles.calDotCompleted, styles.calDotSmall]} />
            <Text style={styles.calLegendText}>Read</Text>
          </View>
          <View style={styles.calLegendItem}>
            <View style={[styles.calDot, styles.calDotMissed, styles.calDotSmall]} />
            <Text style={styles.calLegendText}>Missed</Text>
          </View>
          <View style={styles.calLegendItem}>
            <View style={[styles.calDot, styles.calDotToday, styles.calDotSmall]} />
            <Text style={styles.calLegendText}>Today</Text>
          </View>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionLabel}>READING LOG</Text>

        {readingLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={36} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No readings yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete your first reading verification to see your history here.
            </Text>
          </View>
        ) : (
          readingLogs.slice(0, 20).map((log, i) => (
            <View key={log.id ?? i} style={styles.logCard}>
              <View style={styles.logLeft}>
                <View
                  style={[
                    styles.logStatusDot,
                    log.passed ? styles.logStatusDotPassed : styles.logStatusDotFailed,
                  ]}
                >
                  {log.passed ? (
                    <CheckCircle2 size={14} color={colors.unlocked} />
                  ) : (
                    <XCircle size={14} color={colors.error} />
                  )}
                </View>
                <View style={styles.logInfo}>
                  <Text style={styles.logDate}>{getDayLabel(log.date)}</Text>
                  <Text style={styles.logBook} numberOfLines={1}>
                    {log.bookTitle}
                  </Text>
                </View>
              </View>
              <View style={styles.logRight}>
                <Text style={styles.logPages}>{log.pagesRead} pg</Text>
                <Text
                  style={[
                    styles.logStatus,
                    { color: log.passed ? colors.unlocked : colors.error },
                  ]}
                >
                  {log.passed ? "Passed" : "Failed"}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {streak.currentStreak >= 3 && (
        <View style={styles.motivationCard}>
          <Text style={styles.motivationEmoji}>
            {streak.currentStreak >= 30 ? "🏆" : streak.currentStreak >= 14 ? "🔥" : "⭐"}
          </Text>
          <View style={styles.motivationText}>
            <Text style={styles.motivationTitle}>
              {streak.currentStreak >= 30
                ? "Legend!"
                : streak.currentStreak >= 14
                ? "On Fire!"
                : "Great Start!"}
            </Text>
            <Text style={styles.motivationSubtitle}>
              {streak.currentStreak} day streak — keep it going!
            </Text>
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
  heroRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    gap: 5,
  },
  heroFlameWrap: {
    marginBottom: 2,
  },
  heroTrophyWrap: {
    marginBottom: 2,
  },
  heroZapWrap: {
    marginBottom: 2,
  },
  heroNum: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: colors.textMuted,
    letterSpacing: -0.5,
  },
  heroNumActive: {
    color: colors.accent,
  },
  heroNumGold: {
    color: "#FFD700",
  },
  heroNumGreen: {
    color: colors.success,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: colors.textMuted,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  statItemText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },
  statItemVal: {
    color: colors.textPrimary,
    fontWeight: "700" as const,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  calendarSection: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  calendarGrid: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  calendarRow: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  calDot: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: colors.surfaceLight,
  },
  calDotSmall: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  calDotCompleted: {
    backgroundColor: colors.unlocked,
  },
  calDotMissed: {
    backgroundColor: colors.surfaceLight,
  },
  calDotToday: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.accent,
  },
  calLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
    marginTop: spacing.xs,
  },
  calLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  calLegendText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },
  historySection: {
    gap: spacing.md,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  logStatusDot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logStatusDotPassed: {
    backgroundColor: "rgba(76,175,130,0.12)",
  },
  logStatusDotFailed: {
    backgroundColor: "rgba(224,85,85,0.12)",
  },
  logInfo: {
    gap: 2,
    flex: 1,
  },
  logDate: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: colors.textPrimary,
  },
  logBook: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },
  logRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  logPages: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: colors.textSecondary,
  },
  logStatus: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  motivationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: "rgba(245,166,35,0.08)",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.2)",
    padding: spacing.xl,
  },
  motivationEmoji: {
    fontSize: 36,
  },
  motivationText: {
    flex: 1,
    gap: 3,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: colors.accent,
    letterSpacing: -0.3,
  },
  motivationSubtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.textSecondary,
  },
});
