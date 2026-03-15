import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  BookOpen,
  Smartphone,
  Camera,
  Flame,
  Sparkles,
  CheckCircle,
  Lock,
} from "lucide-react-native";
import { colors, spacing, radius, typography } from "@/constants/theme";
import { useAppState } from "@/providers/AppProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SlideData {
  id: string;
  headline: string;
  subline: string;
  cta: string;
  canSkip: boolean;
  renderIllustration: (animValue: Animated.Value) => React.ReactNode;
}

const SLIDES: SlideData[] = [
  {
    id: "hook",
    headline: "Your future self\nreads every day.",
    subline: "Most people never start. You're already here.",
    cta: "Let's go",
    canSkip: true,
    renderIllustration: (anim) => (
      <View style={illustrationStyles.container}>
        <Animated.View
          style={[
            illustrationStyles.glowCircle,
            {
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.1],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            illustrationStyles.iconWrapper,
            {
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
              opacity: anim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1, 1],
              }),
            },
          ]}
        >
          <BookOpen color={colors.accent} size={72} strokeWidth={1.5} />
        </Animated.View>
        <Animated.View
          style={[
            illustrationStyles.rays,
            {
              opacity: anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.4, 0.7],
              }),
            },
          ]}
        >
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                illustrationStyles.ray,
                {
                  transform: [{ rotate: `${i * 60}deg` }],
                },
              ]}
            />
          ))}
        </Animated.View>
      </View>
    ),
  },
  {
    id: "problem",
    headline: "The scroll never stops.\nUntil now.",
    subline: "Lock your apps until you've read your pages. Then unlock everything.",
    cta: "Makes sense",
    canSkip: true,
    renderIllustration: (anim) => (
      <View style={illustrationStyles.container}>
        <Animated.View
          style={[
            illustrationStyles.phoneStack,
            {
              opacity: anim.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: [0, 0.4, 0.4],
              }),
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.1, 0.9],
                  }),
                },
              ],
            },
          ]}
        >
          <Smartphone color={colors.textMuted} size={80} strokeWidth={1} />
          <View style={illustrationStyles.lockOverlay}>
            <Lock color={colors.error} size={24} />
          </View>
        </Animated.View>
        <Animated.View
          style={[
            illustrationStyles.bookForeground,
            {
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ],
              opacity: anim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1, 1],
              }),
            },
          ]}
        >
          <BookOpen color={colors.accent} size={64} strokeWidth={1.5} />
        </Animated.View>
      </View>
    ),
  },
  {
    id: "proof",
    headline: "Prove you read it.\nNo cheating.",
    subline: "Photograph your page. Answer two questions. Done.",
    cta: "I'm in",
    canSkip: true,
    renderIllustration: (anim) => (
      <View style={illustrationStyles.container}>
        <Animated.View
          style={[
            illustrationStyles.proofRow,
            {
              opacity: anim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1, 1],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              illustrationStyles.proofStep,
              {
                transform: [
                  {
                    translateX: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={illustrationStyles.proofCircle}>
              <Camera color={colors.accent} size={28} />
            </View>
          </Animated.View>
          <Animated.View
            style={[
              illustrationStyles.proofStep,
              {
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={illustrationStyles.proofCircle}>
              <Sparkles color={colors.accent} size={28} />
            </View>
          </Animated.View>
          <Animated.View
            style={[
              illustrationStyles.proofStep,
              {
                transform: [
                  {
                    translateX: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={illustrationStyles.proofCircle}>
              <CheckCircle color={colors.success} size={28} />
            </View>
          </Animated.View>
        </Animated.View>
        <Animated.View
          style={{
            opacity: anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0, 1],
            }),
          }}
        >
          <View style={illustrationStyles.connectorLine} />
        </Animated.View>
      </View>
    ),
  },
  {
    id: "streak",
    headline: "One page a day.\nEvery day.",
    subline: "Streaks build readers. Readers build lives.",
    cta: "Start my streak",
    canSkip: false,
    renderIllustration: (anim) => (
      <View style={illustrationStyles.container}>
        <Animated.View
          style={[
            illustrationStyles.flameWrapper,
            {
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1.15, 1],
                  }),
                },
              ],
              opacity: anim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1, 1],
              }),
            },
          ]}
        >
          <Flame color={colors.accent} size={72} strokeWidth={1.5} fill={colors.accent} />
        </Animated.View>
        <Animated.View
          style={[
            illustrationStyles.heatmapGrid,
            {
              opacity: anim.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: [0, 0, 1],
              }),
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {[...Array(21)].map((_, i) => {
            const isLit = i < 14 || (i >= 14 && Math.random() > 0.4);
            return (
              <View
                key={i}
                style={[
                  illustrationStyles.heatCell,
                  isLit && illustrationStyles.heatCellLit,
                  i < 7 && illustrationStyles.heatCellBright,
                ]}
              />
            );
          })}
        </Animated.View>
      </View>
    ),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAppState();
  const flatListRef = useRef<Animated.FlatList<SlideData>>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  const animateSlide = useCallback(
    (index: number) => {
      slideAnims[index].setValue(0);
      Animated.spring(slideAnims[index], {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();
    },
    [slideAnims]
  );

  useEffect(() => {
    animateSlide(0);
  }, [animateSlide]);

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
      animateSlide(nextIndex);
    } else {
      completeOnboarding();
      router.replace("/auth");
    }
  }, [currentIndex, animateSlide, completeOnboarding, router]);

  const handleSkip = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    completeOnboarding();
    router.replace("/auth");
  }, [completeOnboarding, router]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const idx = viewableItems[0].index;
        setCurrentIndex(idx);
        animateSlide(idx);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = useCallback(
    ({ item, index }: { item: SlideData; index: number }) => {
      const inputRange = [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ];

      const parallaxTranslate = scrollX.interpolate({
        inputRange,
        outputRange: [SCREEN_WIDTH * 0.3, 0, -SCREEN_WIDTH * 0.3],
        extrapolate: "clamp",
      });

      const textOpacity = scrollX.interpolate({
        inputRange,
        outputRange: [0, 1, 0],
        extrapolate: "clamp",
      });

      return (
        <View style={styles.slide}>
          <Animated.View
            style={[
              styles.illustrationArea,
              { transform: [{ translateX: parallaxTranslate }] },
            ]}
          >
            {item.renderIllustration(slideAnims[index])}
          </Animated.View>

          <Animated.View style={[styles.textArea, { opacity: textOpacity }]}>
            <Text style={styles.headline}>{item.headline}</Text>
            <Text style={styles.subline}>{item.subline}</Text>
          </Animated.View>
        </View>
      );
    },
    [scrollX, slideAnims]
  );

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["transparent", "rgba(245, 166, 35, 0.03)", "rgba(245, 166, 35, 0.06)"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {currentSlide?.canSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            testID="onboarding-skip"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item: SlideData) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_: unknown, index: number) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          style={styles.flatList}
        />

        <View style={styles.bottomArea}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => {
              const dotScale = scrollX.interpolate({
                inputRange: [
                  (i - 1) * SCREEN_WIDTH,
                  i * SCREEN_WIDTH,
                  (i + 1) * SCREEN_WIDTH,
                ],
                outputRange: [1, 1.3, 1],
                extrapolate: "clamp",
              });
              const dotOpacity = scrollX.interpolate({
                inputRange: [
                  (i - 1) * SCREEN_WIDTH,
                  i * SCREEN_WIDTH,
                  (i + 1) * SCREEN_WIDTH,
                ],
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      opacity: dotOpacity,
                      transform: [{ scale: dotScale }],
                      backgroundColor:
                        i === currentIndex ? colors.accent : colors.textMuted,
                    },
                  ]}
                />
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleNext}
            activeOpacity={0.85}
            testID="onboarding-cta"
          >
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{currentSlide?.cta ?? "Next"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const illustrationStyles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  glowCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.15,
  },
  iconWrapper: {
    zIndex: 2,
  },
  rays: {
    position: "absolute",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  ray: {
    position: "absolute",
    width: 2,
    height: 100,
    backgroundColor: colors.accent,
    opacity: 0.15,
  },
  phoneStack: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  lockOverlay: {
    position: "absolute",
    top: 12,
    right: -8,
    backgroundColor: "rgba(224, 85, 85, 0.2)",
    borderRadius: 12,
    padding: 4,
  },
  bookForeground: {
    zIndex: 2,
    marginTop: -20,
  },
  proofRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  proofStep: {
    alignItems: "center",
  },
  proofCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(245, 166, 35, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 166, 35, 0.25)",
  },
  connectorLine: {
    width: 120,
    height: 2,
    backgroundColor: "rgba(245, 166, 35, 0.15)",
    marginTop: 24,
    borderRadius: 1,
  },
  flameWrapper: {
    marginBottom: 24,
  },
  heatmapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 7 * 28,
    gap: 4,
  },
  heatCell: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  heatCellLit: {
    backgroundColor: "rgba(245, 166, 35, 0.3)",
  },
  heatCellBright: {
    backgroundColor: "rgba(245, 166, 35, 0.6)",
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: 8,
    right: spacing.xl,
    zIndex: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 15,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: spacing.xxxl,
  },
  illustrationArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  textArea: {
    paddingBottom: spacing.xxl,
  },
  headline: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: colors.textPrimary,
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  subline: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    fontSize: 17,
  },
  bottomArea: {
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.lg,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xxl,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ctaButton: {
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.sm,
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
    letterSpacing: 0.3,
  },
});
