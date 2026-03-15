import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius } from "@/constants/theme";
import { useAppState } from "@/providers/AppProvider";
import {
  BookOpen,
  LogOut,
  ChevronRight,
  Crown,
  RotateCcw,
  Shield,
  Bell,
  Smartphone,
  Info,
  Star,
  Trash2,
} from "lucide-react-native";

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  testID?: string;
}

function SettingRow({ icon, label, sublabel, right, onPress, danger, testID }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      testID={testID}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={16} color={colors.textMuted} /> : null)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, streak, isPro, signOut, resetDaily, readingLogs } = useAppState();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? Your reading data will be cleared.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            void signOut();
          },
        },
      ]
    );
  }, [signOut]);

  const handleResetToday = useCallback(() => {
    Alert.alert(
      "Reset Today",
      "This will mark today as incomplete so you can re-verify your reading.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            resetDaily();
          },
        },
      ]
    );
  }, [resetDaily]);

  const handleChangeBook = useCallback(() => {
    router.push("/book-setup");
  }, [router]);

  const handleUpgrade = useCallback(() => {
    router.push("/paywall");
  }, [router]);

  const handleDeleteData = useCallback(() => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete your reading history, streaks, and book data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: () => {
            void signOut();
          },
        },
      ]
    );
  }, [signOut]);

  const appVersion = "1.0.0";

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
          title: "Settings",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <BookOpen size={28} color={colors.accent} strokeWidth={2} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileTitle}>PageLock</Text>
          <Text style={styles.profileSub}>
            {readingLogs.length} days logged · {streak.currentStreak} day streak
          </Text>
        </View>
        {isPro ? (
          <View style={styles.proBadge}>
            <Crown size={12} color="#FFD700" />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.upgradeChip} onPress={handleUpgrade}>
            <Crown size={12} color={colors.accent} />
            <Text style={styles.upgradeChipText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isPro && (
        <TouchableOpacity
          style={styles.paywallBanner}
          onPress={handleUpgrade}
          activeOpacity={0.85}
          testID="upgrade-banner"
        >
          <View>
            <Text style={styles.paywallBannerTitle}>Unlock PageLock Pro</Text>
            <Text style={styles.paywallBannerSub}>Unlimited books · Priority AI grading</Text>
          </View>
          <View style={styles.paywallBannerBtn}>
            <Star size={14} color={colors.background} />
            <Text style={styles.paywallBannerBtnText}>Get Pro</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>READING</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<BookOpen size={18} color={colors.accent} />}
            label="Change Book"
            sublabel={profile.currentBookTitle || "No book set"}
            onPress={handleChangeBook}
            testID="change-book-btn"
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<RotateCcw size={18} color={colors.textSecondary} />}
            label="Reset Today's Progress"
            sublabel="Re-verify your reading for today"
            onPress={handleResetToday}
            testID="reset-today-btn"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<Bell size={18} color={colors.textSecondary} />}
            label="Daily Reminder"
            sublabel="Get reminded to read each day"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: colors.surfaceLight,
                  true: "rgba(245,166,35,0.4)",
                }}
                thumbColor={notificationsEnabled ? colors.accent : colors.textMuted}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Smartphone size={18} color={colors.textSecondary} />}
            label="Locked Apps"
            sublabel={
              profile.lockedApps.length > 0
                ? `${profile.lockedApps.length} apps monitored`
                : "No apps selected"
            }
            onPress={handleChangeBook}
            testID="manage-apps-btn"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<Shield size={18} color={colors.textSecondary} />}
            label="Privacy Policy"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<Info size={18} color={colors.textSecondary} />}
            label="Version"
            right={
              <Text style={styles.versionText}>{appVersion}</Text>
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<Trash2 size={18} color={colors.error} />}
            label="Delete All Data"
            sublabel="Permanently remove all reading history"
            onPress={handleDeleteData}
            danger
            testID="delete-data-btn"
          />
          <View style={styles.divider} />
          <SettingRow
            icon={<LogOut size={18} color={colors.error} />}
            label="Sign Out"
            onPress={handleSignOut}
            danger
            testID="sign-out-btn"
          />
        </View>
      </View>

      <Text style={styles.footer}>
        Made with 📚 by PageLock
      </Text>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginTop: spacing.sm,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: "rgba(245,166,35,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  profileSub: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,215,0,0.12)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: "#FFD700",
    letterSpacing: 1,
  },
  upgradeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245,166,35,0.12)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.25)",
  },
  upgradeChipText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.accent,
  },
  paywallBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(245,166,35,0.08)",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.2)",
    padding: spacing.xl,
  },
  paywallBannerTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  paywallBannerSub: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.textMuted,
    marginTop: 2,
  },
  paywallBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  paywallBannerBtnText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: colors.background,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    minHeight: 58,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowIconDanger: {
    backgroundColor: "rgba(224,85,85,0.1)",
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  rowLabelDanger: {
    color: colors.error,
  },
  rowSublabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: colors.textMuted,
    lineHeight: 16,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.textMuted,
    paddingTop: spacing.sm,
  },
});
