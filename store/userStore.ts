import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isYesterday, isToday, parseISO, format, subDays, isSameDay } from 'date-fns';

export type UserGoal = 'Weight Loss' | 'Muscle Gain' | 'Weight Gain';

export interface MealReminder {
  id: string;
  label: string;
  time: string; // HH:mm format
  active: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  weightKg: string;
  heightCm: string;
  weightGoal: string;
  weightUnit: 'kg' | 'lbs';
  goal: UserGoal;
  gender: string;
  hasCompletedOnboarding: boolean;
  streak: number;
  lastStreakUpdate: string | null; // ISO date string YYYY-MM-DD
  waterIntake: Record<string, number>; // YYYY-MM-DD -> ml
  weightHistory: Record<string, { weight: number; imageUri?: string }>; // YYYY-MM-DD -> { weight, imageUri }
  notificationsEnabled: boolean;
  waterNotificationsEnabled: boolean;
  mealReminders: MealReminder[];
  waterReminders: MealReminder[];
}

interface UserState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  addWater: (amount: number, date: string) => void;
  logWeight: (weight: number, date: string) => void;
  getWeightTrend: () => { change: number; type: 'lost' | 'gained' | 'stable' } | null;
  getWaterGoal: () => number;
  checkAndIncrementStreak: (currentCalories: number, goalCalories: number, currentWater: number, goalWater: number) => void;
  calculateDefaultReminders: (goal: UserGoal) => MealReminder[];
  calculateDefaultWaterReminders: () => MealReminder[];
  initializeReminders: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: {
        name: '',
        email: '',
        weightKg: '70',
        heightCm: '170',
        weightGoal: '65',
        weightUnit: 'lbs',
        goal: 'Weight Loss',
        gender: 'Other',
        hasCompletedOnboarding: false,
        streak: 0,
        lastStreakUpdate: null,
        waterIntake: {},
        weightHistory: {},
        notificationsEnabled: false,
        waterNotificationsEnabled: false,
        mealReminders: [],
        waterReminders: [],
      },
      completeOnboarding: () =>
        set((state) => ({
          profile: { ...state.profile, hasCompletedOnboarding: true },
        })),
      updateProfile: (updates) =>
        set((state) => {
          const newProfile = { ...state.profile, ...updates };
          
          // If goal changed, automatically recalculate meal reminders
          if (updates.goal && updates.goal !== state.profile.goal) {
            newProfile.mealReminders = get().calculateDefaultReminders(updates.goal);
          }
          
          return { profile: newProfile };
        }),
      addWater: (amount, date) =>
        set((state) => {
          const waterIntake = state.profile?.waterIntake ?? {};
          const current = waterIntake[date] ?? 0;
          return {
            profile: {
              ...state.profile,
              waterIntake: {
                ...waterIntake,
                [date]: current + amount,
              },
            },
          };
        }),
      logWeight: (weight, date, imageUri) =>
        set((state) => ({
          profile: {
            ...state.profile,
            weightKg: weight.toString(),
            weightHistory: {
              ...(state.profile?.weightHistory || {}),
              [date]: { weight, imageUri },
            },
          },
        })),
      getWeightTrend: () => {
        const history = get().profile?.weightHistory || {};
        // Sort dates chronologically to find the actual "previous" entry relative to the latest
        const dates = Object.keys(history).sort((a, b) => a.localeCompare(b));
        if (dates.length < 2) return null;
        
        const latestDate = dates[dates.length - 1];
        const previousDate = dates[dates.length - 2];
        
        const latestEntry = history[latestDate];
        const previousEntry = history[previousDate];
        
        const latest = typeof latestEntry === 'number' ? latestEntry : latestEntry.weight;
        const previous = typeof previousEntry === 'number' ? previousEntry : previousEntry.weight;
        const change = latest - previous;
        
        return {
          change: Math.abs(change),
          rawChange: change,
          type: change < 0 ? 'lost' : change > 0 ? 'gained' : 'stable'
        };
      },
      getWaterGoal: () => {
        const state = get();
        const profile = state?.profile;
        if (!profile) return 2500;
        const weight = parseFloat(profile.weightKg) || 70;
        // Base: 35ml per kg
        let baseGoal = weight * 35;
        // Adjust for goals
        if (profile.goal === 'Muscle Gain' || profile.goal === 'Weight Gain') baseGoal += 500;
        return Math.round(baseGoal);
      },
      checkAndIncrementStreak: (currentCalories, goalCalories, currentWater, goalWater) =>
        set((state) => {
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          const { streak, lastStreakUpdate } = state.profile;

          // Only update if BOTH goals are met and not already updated today
          // Calorie threshold: 80%, Water threshold: 100%
          const caloriesMet = currentCalories >= goalCalories * 0.8;
          const waterMet = currentWater >= goalWater;

          if (caloriesMet && waterMet && lastStreakUpdate !== todayStr) {
            let newStreak = streak;
            
            if (!lastStreakUpdate) {
              newStreak = 1;
            } else {
              const lastDate = parseISO(lastStreakUpdate);
              if (isYesterday(lastDate)) {
                newStreak = streak + 1;
              } else if (!isToday(lastDate)) {
                // Missed a day or more
                newStreak = 1;
              }
            }

            return {
              profile: {
                ...state.profile,
                streak: newStreak,
                lastStreakUpdate: todayStr,
              },
            };
          }
          return state;
        }),
      calculateDefaultReminders: (goal) => {
        if (goal === 'Muscle Gain') {
          // Muscle Gain: 5 intervals to maintain protein synthesis and nitrogen balance
          return [
            { id: 'm1', label: 'Breakfast', time: '07:30', active: true },
            { id: 'm2', label: 'Mid-Morning Snack', time: '10:30', active: true },
            { id: 'm3', label: 'Lunch', time: '13:30', active: true },
            { id: 'm4', label: 'Afternoon Fuel', time: '16:30', active: true },
            { id: 'm5', label: 'Dinner', time: '20:00', active: true },
          ];
        }
        if (goal === 'Weight Gain') {
          // Weight Gain: 4 calorie-dense meals to ensure surplus without excessive fullness
          return [
            { id: 'm1', label: 'Breakfast', time: '08:00', active: true },
            { id: 'm2', label: 'Lunch', time: '12:00', active: true },
            { id: 'm3', label: 'Afternoon Meal', time: '16:00', active: true },
            { id: 'm4', label: 'Dinner', time: '20:00', active: true },
          ];
        }
        // Weight Loss: 3 meals with specific timing to support metabolic rest and insulin sensitivity
        return [
          { id: 'm1', label: 'Breakfast', time: '08:00', active: true },
          { id: 'm2', label: 'Lunch', time: '13:00', active: true },
          { id: 'm3', label: 'Dinner', time: '18:30', active: true },
        ];
      },
      calculateDefaultWaterReminders: () => {
        // Health Recommended: 8 intervals every 2 hours to ensure consistent cellular hydration
        return [
          { id: 'w1', label: 'Morning Start', time: '08:00', active: true },
          { id: 'w2', label: 'Mid-Morning', time: '10:00', active: true },
          { id: 'w3', label: 'Lunch Hydration', time: '12:00', active: true },
          { id: 'w4', label: 'Afternoon Refresh', time: '14:00', active: true },
          { id: 'w5', label: 'Late Afternoon', time: '16:00', active: true },
          { id: 'w6', label: 'Evening Hydration', time: '18:00', active: true },
          { id: 'w7', label: 'Pre-Dinner', time: '20:00', active: true },
          { id: 'w8', label: 'Night Cap', time: '22:00', active: true },
        ];
      },
      initializeReminders: () => {
        const state = get();
        const mealReminders = state.calculateDefaultReminders(state.profile.goal);
        const waterReminders = state.calculateDefaultWaterReminders();
        set((state) => ({
          profile: { 
            ...state.profile, 
            mealReminders, 
            waterReminders,
            notificationsEnabled: true,
            waterNotificationsEnabled: true 
          }
        }));
      },
    }),
    {
      name: 'lensnutra-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
