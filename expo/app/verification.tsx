import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { generateObject } from "@rork-ai/toolkit-sdk";
import { z } from "zod";
import { colors, spacing, radius } from "@/constants/theme";
import { useAppState } from "@/providers/AppProvider";
import {
  BookOpen,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  MessageSquare,
} from "lucide-react-native";

type Step = "confirm" | "loading" | "questions" | "grading" | "result";

interface Question {
  question: string;
  hint: string;
}

const QuestionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      hint: z.string(),
    })
  ),
});

const GradeSchema = z.object({
  passed: z.boolean(),
  score: z.number(),
  feedback: z.string(),
  questionFeedback: z.array(
    z.object({
      correct: z.boolean(),
      comment: z.string(),
    })
  ),
});

export default function VerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, completeToday } = useAppState();

  const [step, setStep] = useState<Step>("confirm");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [passed, setPassed] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [questionFeedback, setQuestionFeedback] = useState<
    { correct: boolean; comment: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  const transitionStep = useCallback(
    (nextStep: Step) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.96,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStep(nextStep);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeAnim, scaleAnim]
  );

  const animateResult = useCallback(() => {
    Animated.sequence([
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(resultScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [resultOpacity, resultScale]);

  const generateQuestions = useCallback(async () => {
    transitionStep("loading");
    setError(null);

    try {
      const bookInfo = profile.currentBookAuthor
        ? `"${profile.currentBookTitle}" by ${profile.currentBookAuthor}`
        : `"${profile.currentBookTitle}"`;

      const result = await generateObject({
        messages: [
          {
            role: "user",
            content: `Generate exactly 3 reading comprehension questions for the book ${bookInfo}. These questions should test genuine reading — covering plot, characters, themes, or specific scenes. Keep questions open-ended so the reader can demonstrate understanding. Also provide a short hint for each question to guide the answer. Return exactly 3 questions.`,
          },
        ],
        schema: QuestionsSchema,
      });

      const qs = result.questions.slice(0, 3);
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(""));
      setActiveQuestion(0);
      transitionStep("questions");
    } catch (e) {
      console.error("Failed to generate questions:", e);
      setError("Failed to generate questions. Please try again.");
      transitionStep("confirm");
    }
  }, [profile, transitionStep]);

  const gradeAnswers = useCallback(async () => {
    const hasAllAnswers = answers.every((a) => a.trim().length > 5);
    if (!hasAllAnswers) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setError(null);
    transitionStep("grading");

    try {
      const bookInfo = profile.currentBookAuthor
        ? `"${profile.currentBookTitle}" by ${profile.currentBookAuthor}`
        : `"${profile.currentBookTitle}"`;

      const qa = questions
        .map(
          (q, i) =>
            `Q${i + 1}: ${q.question}\nAnswer: ${answers[i]}`
        )
        .join("\n\n");

      const result = await generateObject({
        messages: [
          {
            role: "user",
            content: `You are grading reading comprehension answers for the book ${bookInfo}.\n\nHere are the questions and the reader's answers:\n\n${qa}\n\nGrade each answer. Be lenient — if the reader shows genuine engagement with the book (even if details are slightly off), mark it as correct. Pass the reader if they answer at least 2 out of 3 correctly. Provide brief, encouraging feedback for each answer and an overall feedback message. Score should be a percentage 0-100.`,
          },
        ],
        schema: GradeSchema,
      });

      setPassed(result.passed);
      setScore(result.score);
      setFeedback(result.feedback);
      setQuestionFeedback(result.questionFeedback);

      if (result.passed) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const today = new Date().toISOString().split("T")[0];
        completeToday({
          id: `${today}-${Date.now()}`,
          date: today,
          pagesRead: profile.dailyPageGoal,
          bookTitle: profile.currentBookTitle,
          questions: questions.map((q) => q.question),
          answers,
          passed: true,
        });
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      transitionStep("result");
      setTimeout(animateResult, 100);
    } catch (e) {
      console.error("Failed to grade answers:", e);
      setError("Failed to grade answers. Please try again.");
      transitionStep("questions");
    }
  }, [answers, questions, profile, completeToday, transitionStep, animateResult]);

  const handleRetry = useCallback(() => {
    resultScale.setValue(0);
    resultOpacity.setValue(0);
    setAnswers(new Array(questions.length).fill(""));
    setActiveQuestion(0);
    setError(null);
    transitionStep("questions");
  }, [questions, resultScale, resultOpacity, transitionStep]);

  const handleDone = useCallback(() => {
    router.replace("/");
  }, [router]);

  const progressPct = step === "questions"
    ? Math.round(
        (answers.filter((a) => a.trim().length > 0).length / questions.length) * 100
      )
    : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen
        options={{
          title: "Reading Verification",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerLeft: () =>
            step !== "grading" && step !== "result" ? (
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <ChevronLeft size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : null,
        }}
      />

      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {step === "confirm" && (
          <ConfirmStep
            profile={profile}
            error={error}
            onStart={generateQuestions}
            insets={insets}
          />
        )}

        {step === "loading" && (
          <LoadingStep label="Generating questions…" />
        )}

        {step === "questions" && (
          <QuestionsStep
            questions={questions}
            answers={answers}
            activeQuestion={activeQuestion}
            setActiveQuestion={setActiveQuestion}
            setAnswers={setAnswers}
            onSubmit={gradeAnswers}
            progressPct={progressPct}
            error={error}
            insets={insets}
          />
        )}

        {step === "grading" && (
          <LoadingStep label="Grading your answers…" />
        )}

        {step === "result" && (
          <ResultStep
            passed={passed}
            score={score}
            feedback={feedback}
            questionFeedback={questionFeedback}
            questions={questions}
            answers={answers}
            scaleAnim={resultScale}
            opacityAnim={resultOpacity}
            onRetry={handleRetry}
            onDone={handleDone}
            insets={insets}
          />
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

interface ConfirmStepProps {
  profile: ReturnType<typeof useAppState>["profile"];
  error: string | null;
  onStart: () => void;
  insets: { bottom: number };
}

function ConfirmStep({ profile, error, onStart, insets }: ConfirmStepProps) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.stepContent,
        { paddingBottom: insets.bottom + spacing.huge },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconCircle}>
        <BookOpen size={32} color={colors.accent} strokeWidth={2} />
      </View>

      <Text style={styles.stepTitle}>Verify Your Reading</Text>
      <Text style={styles.stepSubtitle}>
        Answer 3 questions about{" "}
        <Text style={{ color: colors.accent, fontWeight: "700" as const }}>
          {profile.currentBookTitle}
        </Text>{" "}
        to unlock your apps.
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <Text style={styles.infoLabelText}>BOOK</Text>
          </View>
          <Text style={styles.infoValue} numberOfLines={2}>
            {profile.currentBookTitle}
          </Text>
        </View>
        {profile.currentBookAuthor.length > 0 && (
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <View style={styles.infoLabel}>
              <Text style={styles.infoLabelText}>AUTHOR</Text>
            </View>
            <Text style={styles.infoValue}>{profile.currentBookAuthor}</Text>
          </View>
        )}
        <View style={[styles.infoRow, styles.infoRowBorder]}>
          <View style={styles.infoLabel}>
            <Text style={styles.infoLabelText}>GOAL</Text>
          </View>
          <Text style={styles.infoValue}>
            {profile.dailyPageGoal} pages today
          </Text>
        </View>
      </View>

      <View style={styles.howItWorks}>
        <View style={styles.howStep}>
          <View style={styles.howNum}>
            <Text style={styles.howNumText}>1</Text>
          </View>
          <Text style={styles.howText}>
            AI generates 3 questions about your book
          </Text>
        </View>
        <View style={styles.howStep}>
          <View style={styles.howNum}>
            <Text style={styles.howNumText}>2</Text>
          </View>
          <Text style={styles.howText}>
            Answer in your own words — no perfect recall needed
          </Text>
        </View>
        <View style={styles.howStep}>
          <View style={styles.howNum}>
            <Text style={styles.howNumText}>3</Text>
          </View>
          <Text style={styles.howText}>
            Pass 2 of 3 to unlock your apps for today
          </Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <XCircle size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={onStart}
        activeOpacity={0.85}
        testID="start-quiz-btn"
      >
        <Sparkles size={20} color={colors.background} />
        <Text style={styles.primaryBtnText}>Start Quiz</Text>
        <ArrowRight size={18} color={colors.background} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function LoadingStep({ label }: { label: string }) {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIconWrap}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
      <Text style={styles.loadingLabel}>{label}</Text>
      <Text style={styles.loadingSubLabel}>Powered by AI</Text>
    </View>
  );
}

interface QuestionsStepProps {
  questions: Question[];
  answers: string[];
  activeQuestion: number;
  setActiveQuestion: (i: number) => void;
  setAnswers: (a: string[]) => void;
  onSubmit: () => void;
  progressPct: number;
  error: string | null;
  insets: { bottom: number };
}

function QuestionsStep({
  questions,
  answers,
  activeQuestion,
  setActiveQuestion,
  setAnswers,
  onSubmit,
  progressPct,
  error,
  insets,
}: QuestionsStepProps) {
  const handleAnswer = (idx: number, text: string) => {
    const next = [...answers];
    next[idx] = text;
    setAnswers(next);
  };

  const allAnswered = answers.every((a) => a.trim().length > 5);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.stepContent,
        { paddingBottom: insets.bottom + spacing.huge },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.progressRow}>
        <Text style={styles.progressMeta}>
          {answers.filter((a) => a.trim().length > 5).length} of {questions.length} answered
        </Text>
        <Text style={styles.progressMeta}>{progressPct}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      <View style={styles.questionTabsRow}>
        {questions.map((_, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.questionTab,
              activeQuestion === i && styles.questionTabActive,
              answers[i].trim().length > 5 && styles.questionTabDone,
            ]}
            onPress={() => setActiveQuestion(i)}
          >
            <Text
              style={[
                styles.questionTabText,
                activeQuestion === i && styles.questionTabTextActive,
              ]}
            >
              Q{i + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {questions.map((q, i) => (
        <View
          key={i}
          style={[
            styles.questionCard,
            activeQuestion !== i && styles.questionCardHidden,
          ]}
          pointerEvents={activeQuestion === i ? "auto" : "none"}
        >
          <View style={styles.questionCardHeader}>
            <View style={styles.questionNumBadge}>
              <MessageSquare size={13} color={colors.accent} />
              <Text style={styles.questionNumText}>Question {i + 1}</Text>
            </View>
            {answers[i].trim().length > 5 && (
              <CheckCircle2 size={18} color={colors.unlocked} />
            )}
          </View>

          <Text style={styles.questionText}>{q.question}</Text>

          <View style={styles.hintRow}>
            <Text style={styles.hintLabel}>HINT</Text>
            <Text style={styles.hintText}>{q.hint}</Text>
          </View>

          <TextInput
            style={styles.answerInput}
            value={answers[i]}
            onChangeText={(t) => handleAnswer(i, t)}
            placeholder="Write your answer here…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            testID={`answer-input-${i}`}
          />

          {i < questions.length - 1 && (
            <TouchableOpacity
              style={[
                styles.nextQuestionBtn,
                answers[i].trim().length <= 5 && styles.nextQuestionBtnDisabled,
              ]}
              onPress={() => setActiveQuestion(i + 1)}
              disabled={answers[i].trim().length <= 5}
            >
              <Text style={styles.nextQuestionBtnText}>
                Next Question
              </Text>
              <ArrowRight size={16} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {error && (
        <View style={styles.errorBanner}>
          <XCircle size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, !allAnswered && styles.primaryBtnDisabled]}
        onPress={onSubmit}
        disabled={!allAnswered}
        activeOpacity={0.85}
        testID="submit-answers-btn"
      >
        <Sparkles size={20} color={allAnswered ? colors.background : colors.textMuted} />
        <Text
          style={[
            styles.primaryBtnText,
            !allAnswered && styles.primaryBtnTextDisabled,
          ]}
        >
          Submit Answers
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

interface ResultStepProps {
  passed: boolean;
  score: number;
  feedback: string;
  questionFeedback: { correct: boolean; comment: string }[];
  questions: Question[];
  answers: string[];
  scaleAnim: Animated.Value;
  opacityAnim: Animated.Value;
  onRetry: () => void;
  onDone: () => void;
  insets: { bottom: number };
}

function ResultStep({
  passed,
  score,
  feedback,
  questionFeedback,
  questions,
  answers,
  scaleAnim,
  opacityAnim,
  onRetry,
  onDone,
  insets,
}: ResultStepProps) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.stepContent,
        { paddingBottom: insets.bottom + spacing.huge },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.resultHero,
          passed ? styles.resultHeroPassed : styles.resultHeroFailed,
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {passed ? (
          <CheckCircle2 size={52} color={colors.unlocked} strokeWidth={1.5} />
        ) : (
          <XCircle size={52} color={colors.error} strokeWidth={1.5} />
        )}
        <Text style={[styles.resultTitle, { color: passed ? colors.unlocked : colors.error }]}>
          {passed ? "Apps Unlocked!" : "Not Quite"}
        </Text>
        <Text style={styles.resultScore}>{score}% score</Text>
        <Text style={styles.resultFeedback}>{feedback}</Text>
      </Animated.View>

      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownLabel}>ANSWER BREAKDOWN</Text>
        {questions.map((q, i) => {
          const fb = questionFeedback[i];
          const correct = fb?.correct ?? false;
          return (
            <View key={i} style={styles.breakdownCard}>
              <View style={styles.breakdownCardHeader}>
                <Text style={styles.breakdownQNum}>Q{i + 1}</Text>
                {correct ? (
                  <CheckCircle2 size={16} color={colors.unlocked} />
                ) : (
                  <XCircle size={16} color={colors.error} />
                )}
              </View>
              <Text style={styles.breakdownQuestion}>{q.question}</Text>
              <Text style={styles.breakdownAnswer}>"{answers[i]}"</Text>
              {fb?.comment && (
                <Text
                  style={[
                    styles.breakdownComment,
                    { color: correct ? colors.unlocked : colors.error },
                  ]}
                >
                  {fb.comment}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {passed ? (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onDone}
          activeOpacity={0.85}
          testID="done-btn"
        >
          <CheckCircle2 size={20} color={colors.background} />
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.retryActions}>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={onRetry}
            activeOpacity={0.85}
            testID="retry-btn"
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onDone}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backBtn: {
    padding: spacing.xs,
  },
  stepContent: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: "rgba(245,166,35,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.25)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoLabel: {
    width: 62,
  },
  infoLabelText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  howItWorks: {
    gap: spacing.md,
  },
  howStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  howNum: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: "rgba(245,166,35,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.3)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  howNumText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.accent,
  },
  howText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingTop: 3,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.background,
    flex: 1,
    textAlign: "center",
  },
  primaryBtnTextDisabled: {
    color: colors.textMuted,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(224,85,85,0.1)",
    borderWidth: 1,
    borderColor: "rgba(224,85,85,0.25)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.error,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  loadingIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: "rgba(245,166,35,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLabel: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  loadingSubLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressMeta: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 5,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  questionTabsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  questionTab: {
    flex: 1,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  questionTabActive: {
    borderColor: colors.accent,
    backgroundColor: "rgba(245,166,35,0.1)",
  },
  questionTabDone: {
    borderColor: colors.unlocked,
    backgroundColor: "rgba(76,175,130,0.1)",
  },
  questionTabText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: colors.textMuted,
  },
  questionTabTextActive: {
    color: colors.accent,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  questionCardHidden: {
    display: "none",
  },
  questionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  questionNumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  questionNumText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.accent,
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: colors.textPrimary,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  hintRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
    backgroundColor: "rgba(245,166,35,0.07)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  hintLabel: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: colors.accent,
    letterSpacing: 1,
    paddingTop: 2,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  answerInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500" as const,
    minHeight: 110,
    lineHeight: 22,
  },
  nextQuestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  nextQuestionBtnDisabled: {
    opacity: 0.4,
  },
  nextQuestionBtnText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.accent,
  },
  resultHero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  resultHeroPassed: {
    backgroundColor: "rgba(76,175,130,0.08)",
    borderColor: "rgba(76,175,130,0.25)",
  },
  resultHeroFailed: {
    backgroundColor: "rgba(224,85,85,0.08)",
    borderColor: "rgba(224,85,85,0.25)",
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  resultScore: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.textMuted,
  },
  resultFeedback: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  breakdownSection: {
    gap: spacing.md,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  breakdownCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdownQNum: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  breakdownQuestion: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  breakdownAnswer: {
    fontSize: 13,
    fontWeight: "400" as const,
    color: colors.textMuted,
    fontStyle: "italic",
    lineHeight: 18,
  },
  breakdownComment: {
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
  retryActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  retryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.background,
  },
  cancelBtn: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.textMuted,
  },
});
