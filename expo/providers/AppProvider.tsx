import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface UserProfile {
  currentBookTitle: string;
  currentBookAuthor: string;
  totalPages: number;
  dailyPageGoal: number;
  lockedApps: string[];
}

interface ReadingLog {
  id: string;
  date: string;
  pagesRead: number;
  bookTitle: string;
  questions: string[];
  answers: string[];
  passed: boolean;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

interface AppState {
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  isPro: boolean;
  profile: UserProfile;
  streak: StreakData;
  readingLogs: ReadingLog[];
  todayCompleted: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  currentBookTitle: '',
  currentBookAuthor: '',
  totalPages: 0,
  dailyPageGoal: 5,
  lockedApps: [],
};

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

const STORAGE_KEY = 'pagelock_app_state';

export const [AppProvider, useAppState] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AppState>({
    hasCompletedOnboarding: false,
    isAuthenticated: false,
    isPro: false,
    profile: DEFAULT_PROFILE,
    streak: DEFAULT_STREAK,
    readingLogs: [],
    todayCompleted: false,
  });

  const stateQuery = useQuery({
    queryKey: ['appState'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AppState;
      }
      return null;
    },
  });

  const sessionQuery = useQuery({
    queryKey: ['supabaseSession'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    },
  });

  useEffect(() => {
    if (sessionQuery.isLoading) return;
    const base = stateQuery.data ?? {
      hasCompletedOnboarding: false,
      isAuthenticated: false,
      isPro: false,
      profile: DEFAULT_PROFILE,
      streak: DEFAULT_STREAK,
      readingLogs: [],
      todayCompleted: false,
    };
    setState({ ...base, isAuthenticated: sessionQuery.data ?? false });
  }, [stateQuery.data, sessionQuery.data, sessionQuery.isLoading]);

  const persistState = useCallback(async (newState: AppState) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates };
      void persistState(next);
      return next;
    });
  }, [persistState]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setState((prev) => {
      const next = {
        ...prev,
        profile: { ...prev.profile, ...updates },
      };
      void persistState(next);
      return next;
    });
  }, [persistState]);

  const completeOnboarding = useCallback(() => {
    updateState({ hasCompletedOnboarding: true });
  }, [updateState]);

  const setAuthenticated = useCallback((value: boolean) => {
    updateState({ isAuthenticated: value });
  }, [updateState]);

  const setPro = useCallback((value: boolean) => {
    updateState({ isPro: value });
  }, [updateState]);

  const completeToday = useCallback((log: ReadingLog) => {
    setState((prev) => {
      const today = new Date().toISOString().split('T')[0];
      const wasYesterday = prev.streak.lastCompletedDate === getYesterdayDate();
      const newStreak = wasYesterday ? prev.streak.currentStreak + 1 : 1;
      const next: AppState = {
        ...prev,
        todayCompleted: true,
        readingLogs: [log, ...prev.readingLogs],
        streak: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, prev.streak.longestStreak),
          lastCompletedDate: today,
        },
      };
      void persistState(next);
      return next;
    });
  }, [persistState]);

  const resetDaily = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.streak.lastCompletedDate !== today) {
      updateState({ todayCompleted: false });
    }
  }, [state.streak.lastCompletedDate, updateState]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[AppProvider] Supabase signOut error:', e);
    }
    if (Platform.OS !== 'web') {
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        console.warn('[AppProvider] GoogleSignin signOut error:', e);
      }
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({
      hasCompletedOnboarding: false,
      isAuthenticated: false,
      isPro: false,
      profile: DEFAULT_PROFILE,
      streak: DEFAULT_STREAK,
      readingLogs: [],
      todayCompleted: false,
    });
    void queryClient.invalidateQueries({ queryKey: ['appState'] });
    void queryClient.invalidateQueries({ queryKey: ['supabaseSession'] });
  }, [queryClient]);

  return useMemo(() => ({
    ...state,
    isLoading: stateQuery.isLoading || sessionQuery.isLoading,
    updateState,
    updateProfile,
    completeOnboarding,
    setAuthenticated,
    setPro,
    completeToday,
    resetDaily,
    signOut,
  }), [state, stateQuery.isLoading, sessionQuery.isLoading, updateState, updateProfile, completeOnboarding, setAuthenticated, setPro, completeToday, resetDaily, signOut]);
});

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
