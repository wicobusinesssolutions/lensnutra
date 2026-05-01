import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

export interface DayActivity {
  steps: number;
  exerciseMinutes: number;
  caloriesBurned: number;
}

interface ActivityState {
  dailyActivity: Record<string, DayActivity>;
  updateSteps: (date: string, steps: number, weightKg: number, heightCm: number) => void;
  addExercise: (date: string, minutes: number, calories: number) => void;
  getActivityForDate: (date: string) => DayActivity;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      dailyActivity: {},
      
      updateSteps: (date, steps, weightKg, heightCm) => set((state) => {
        const current = state.dailyActivity[date] || { steps: 0, exerciseMinutes: 0, caloriesBurned: 0 };
        
        // Guard: Never allow steps to go backwards for the same day
        if (steps < current.steps) return state;

        // Precision MET calculation:
        // 1. Estimate stride length (standard formula: height * 0.414)
        const strideMeters = (heightCm * 0.414) / 100;
        // 2. Calculate distance in km
        const distanceKm = (steps * strideMeters) / 1000;
        // 3. Net calories burned per km per kg is approx 1.036
        const stepCalories = distanceKm * weightKg * 1.036;
        
        return {
          dailyActivity: {
            ...state.dailyActivity,
            [date]: {
              ...current,
              steps,
              // Combine step calories with exercise minutes (MET 5 for general exercise)
              caloriesBurned: Math.round(stepCalories + (current.exerciseMinutes * 5 * (weightKg / 70) * (30/60)))
            }
          }
        };
      }),

      addExercise: (date, minutes, calories) => set((state) => {
        const current = state.dailyActivity[date] || { steps: 0, exerciseMinutes: 0, caloriesBurned: 0 };
        return {
          dailyActivity: {
            ...state.dailyActivity,
            [date]: {
              ...current,
              exerciseMinutes: current.exerciseMinutes + minutes,
              caloriesBurned: current.caloriesBurned + calories
            }
          }
        };
      }),

      getActivityForDate: (date) => {
        return get().dailyActivity[date] || { steps: 0, exerciseMinutes: 0, caloriesBurned: 0 };
      }
    }),
    {
      name: 'lensnutra-activity-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
