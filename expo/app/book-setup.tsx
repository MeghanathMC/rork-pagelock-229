import React, { useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, spacing, radius, typography } from "@/constants/theme";
import { useAppState } from "@/providers/AppProvider";
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";

interface BookResult {
  key: string;
  title: string;
  author_name?: string[];
  number_of_pages_median?: number;
}

const LOCKABLE_APPS = [
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "youtube", label: "YouTube", emoji: "▶️" },
  { id: "twitter", label: "Twitter / X", emoji: "🐦" },
  { id: "reddit", label: "Reddit", emoji: "🤖" },
  { id: "tiktok", label: "TikTok", emoji: "🎵" },
  { id: "facebook", label: "Facebook", emoji: "👍" },
  { id: "snapchat", label: "Snapchat", emoji: "👻" },
  { id: "threads", label: "Threads", emoji: "🧵" },
];

const MIN_GOAL = 1;
const MAX_GOAL = 50;

export default function BookSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateProfile } = useAppState();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [dailyGoal, setDailyGoal] = useState(10);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [showManual, setShowManual] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchBooks = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=6&fields=key,title,author_name,number_of_pages_median`
      );
      const data = await res.json();
      console.log("[BookSetup] Search results:", data.docs?.length);
      setSearchResults(data.docs ?? []);
      setShowResults(true);
    } catch (e) {
      console.error("[BookSetup] Search error:", e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => searchBooks(text), 500);
    },
    [searchBooks]
  );

  const handleSelectBook = useCallback((book: BookResult) => {
    setBookTitle(book.title);
    setBookAuthor(book.author_name?.[0] ?? "");
    setTotalPages(book.number_of_pages_median?.toString() ?? "");
    setSearchQuery(book.title);
    setShowResults(false);
    setShowManual(true);
    console.log("[BookSetup] Selected book:", book.title);
  }, []);

  const toggleApp = useCallback((appId: string) => {
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((a) => a !== appId) : [...prev, appId]
    );
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!bookTitle.trim()) throw new Error("Please enter a book title");
      if (!totalPages || parseInt(totalPages) < 1)
        throw new Error("Please enter valid total pages");
      updateProfile({
        currentBookTitle: bookTitle.trim(),
        currentBookAuthor: bookAuthor.trim(),
        totalPages: parseInt(totalPages) || 0,
        dailyPageGoal: dailyGoal,
        lockedApps: selectedApps,
      });
      console.log("[BookSetup] Profile saved");
    },
    onSuccess: () => {
      router.replace("/(tabs)/(home)");
    },
    onError: (e: Error) => {
      console.error("[BookSetup] Save error:", e.message);
    },
  });

  const isValid = bookTitle.trim().length > 0 && parseInt(totalPages) > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.huge },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FIND YOUR BOOK</Text>
          <View style={styles.searchWrapper}>
            <View style={styles.searchRow}>
              <Search
                size={18}
                color={colors.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title…"
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
                testID="book-search-input"
              />
              {isSearching && (
                <ActivityIndicator
                  size="small"
                  color={colors.accent}
                  style={{ marginRight: spacing.md }}
                />
              )}
              {searchQuery.length > 0 && !isSearching && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setShowResults(false);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {showResults && searchResults.length > 0 && (
              <View style={styles.resultsDropdown}>
                {searchResults.map((book) => (
                  <TouchableOpacity
                    key={book.key}
                    style={styles.resultItem}
                    onPress={() => handleSelectBook(book)}
                    testID={`book-result-${book.key}`}
                  >
                    <BookOpen
                      size={16}
                      color={colors.accent}
                      style={{ marginRight: spacing.md }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {book.title}
                      </Text>
                      {book.author_name?.[0] && (
                        <Text style={styles.resultAuthor} numberOfLines={1}>
                          {book.author_name[0]}
                        </Text>
                      )}
                    </View>
                    {book.number_of_pages_median && (
                      <Text style={styles.resultPages}>
                        {book.number_of_pages_median}p
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.manualToggle}
            onPress={() => setShowManual((v) => !v)}
            testID="manual-entry-toggle"
          >
            <Text style={styles.manualToggleText}>
              {showManual ? "Hide manual entry" : "Enter manually instead"}
            </Text>
            {showManual ? (
              <ChevronUp size={14} color={colors.accent} />
            ) : (
              <ChevronDown size={14} color={colors.accent} />
            )}
          </TouchableOpacity>
        </View>

        {showManual && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BOOK DETAILS</Text>
            <View style={styles.card}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Book title"
                  placeholderTextColor={colors.textMuted}
                  value={bookTitle}
                  onChangeText={setBookTitle}
                  testID="book-title-input"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Author</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Author name"
                  placeholderTextColor={colors.textMuted}
                  value={bookAuthor}
                  onChangeText={setBookAuthor}
                  testID="book-author-input"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Pages</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Total pages"
                  placeholderTextColor={colors.textMuted}
                  value={totalPages}
                  onChangeText={setTotalPages}
                  keyboardType="number-pad"
                  testID="book-pages-input"
                />
              </View>
            </View>
          </View>
        )}

        {bookTitle.length > 0 && !showManual && (
          <View style={styles.selectedBookCard}>
            <BookOpen size={20} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.selectedBookTitle} numberOfLines={1}>
                {bookTitle}
              </Text>
              {bookAuthor.length > 0 && (
                <Text style={styles.selectedBookAuthor} numberOfLines={1}>
                  {bookAuthor}
                </Text>
              )}
            </View>
            {totalPages.length > 0 && (
              <Text style={styles.selectedBookPages}>{totalPages} pages</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DAILY READING GOAL</Text>
          <View style={styles.card}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalValue}>
                <Text style={styles.goalNumber}>{dailyGoal}</Text>
                <Text style={styles.goalUnit}> pages / day</Text>
              </Text>
            </View>
            <View style={styles.sliderRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setDailyGoal((v) => Math.max(MIN_GOAL, v - 1))}
                testID="goal-decrease"
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>

              <View style={styles.segmentTrack}>
                {Array.from({ length: 10 }).map((_, i) => {
                  const segValue = Math.round(
                    MIN_GOAL + (i / 9) * (MAX_GOAL - MIN_GOAL)
                  );
                  const filled = dailyGoal >= segValue;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.segment,
                        filled && styles.segmentFilled,
                        i === 0 && styles.segmentFirst,
                        i === 9 && styles.segmentLast,
                      ]}
                      onPress={() => setDailyGoal(segValue)}
                    />
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setDailyGoal((v) => Math.min(MAX_GOAL, v + 1))}
                testID="goal-increase"
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.goalHints}>
              <Text style={styles.goalHint}>1</Text>
              <Text style={styles.goalHint}>25</Text>
              <Text style={styles.goalHint}>50</Text>
            </View>
            <View style={styles.presetRow}>
              {[5, 10, 20, 30].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    dailyGoal === preset && styles.presetChipActive,
                  ]}
                  onPress={() => setDailyGoal(preset)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      dailyGoal === preset && styles.presetChipTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>APPS TO LOCK</Text>
            <Text style={styles.sectionCount}>
              {selectedApps.length} selected
            </Text>
          </View>
          <Text style={styles.sectionHint}>
            These apps stay locked until you hit your reading goal.
          </Text>
          <View style={styles.appsGrid}>
            {LOCKABLE_APPS.map((app) => {
              const active = selectedApps.includes(app.id);
              return (
                <AppChip
                  key={app.id}
                  emoji={app.emoji}
                  label={app.label}
                  active={active}
                  onPress={() => toggleApp(app.id)}
                  testID={`app-chip-${app.id}`}
                />
              );
            })}
          </View>
        </View>

        {saveMutation.isError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {(saveMutation.error as Error)?.message}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
          onPress={() => saveMutation.mutate()}
          disabled={!isValid || saveMutation.isPending}
          testID="save-book-setup"
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.saveBtnText}>Save & Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AppChip({
  emoji,
  label,
  active,
  onPress,
  testID,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.93,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[styles.appChip, active && styles.appChipActive]}
        onPress={handlePress}
        testID={testID}
      >
        <Text style={styles.appChipEmoji}>{emoji}</Text>
        <Text
          style={[styles.appChipLabel, active && styles.appChipLabelActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {active && (
          <View style={styles.appChipCheck}>
            <Check size={10} color={colors.background} strokeWidth={3} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  sectionHeaderRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.accent,
  },
  sectionHint: {
    ...typography.caption,
    marginTop: -spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden" as const,
    padding: spacing.xl,
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    width: 56,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500" as const,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  searchWrapper: {
    gap: 0,
  },
  searchRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 50,
  },
  searchIcon: {
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  resultsDropdown: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    overflow: "hidden" as const,
  },
  resultItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  resultAuthor: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  resultPages: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  manualToggle: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.xs,
    alignSelf: "flex-start" as const,
    paddingVertical: spacing.xs,
  },
  manualToggleText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.accent,
  },
  selectedBookCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: -spacing.md,
  },
  selectedBookTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  selectedBookAuthor: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedBookPages: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.accent,
  },
  goalHeader: {
    alignItems: "center" as const,
  },
  goalValue: {
    textAlign: "center" as const,
  },
  goalNumber: {
    fontSize: 42,
    fontWeight: "700" as const,
    color: colors.accent,
    letterSpacing: -1,
  },
  goalUnit: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: colors.textSecondary,
  },
  sliderRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.md,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  segmentTrack: {
    flex: 1,
    flexDirection: "row" as const,
    gap: 3,
    height: 32,
    alignItems: "center" as const,
  },
  segment: {
    flex: 1,
    height: 10,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
  },
  segmentFilled: {
    backgroundColor: colors.accent,
  },
  segmentFirst: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  segmentLast: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  goalHints: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 46,
    marginTop: -spacing.xs,
  },
  goalHint: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500" as const,
  },
  presetRow: {
    flexDirection: "row" as const,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  presetChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center" as const,
  },
  presetChipActive: {
    backgroundColor: "rgba(245, 166, 35, 0.15)",
    borderColor: colors.accent,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  presetChipTextActive: {
    color: colors.accent,
  },
  appsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: spacing.sm,
  },
  appChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative" as const,
  },
  appChipActive: {
    backgroundColor: "rgba(245, 166, 35, 0.12)",
    borderColor: colors.accent,
  },
  appChipEmoji: {
    fontSize: 16,
  },
  appChipLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  appChipLabelActive: {
    color: colors.textPrimary,
  },
  appChipCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginLeft: 2,
  },
  errorBanner: {
    backgroundColor: "rgba(224, 85, 85, 0.12)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: "center" as const,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    height: 56,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.background,
    letterSpacing: 0.2,
  },
});
