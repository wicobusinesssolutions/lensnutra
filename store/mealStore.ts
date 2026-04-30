import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Ingredient {
  name: string;
  calories: number;
  portion: string;
  x?: number;
  y?: number;
}

export interface Meal {
  id: string;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  antioxidants: string;
  description: string;
  healthBenefits: string;
  ingredients: Ingredient[];
  imageUri: string;
  timestamp: number;
}

interface MealState {
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  deleteMeal: (mealId: string) => void;
  clearHistory: () => void;
}

export const useMealStore = create<MealState>()(
  persist(
    (set) => ({
      meals: [],
      addMeal: (meal) => set((state) => ({ 
        meals: [meal, ...state.meals].slice(0, 50) // Keep last 50 meals
      })),
      deleteMeal: (mealId) => set((state) => ({
        meals: state.meals.filter((m) => m.id !== mealId)
      })),
      clearHistory: () => set({ meals: [] }),
    }),
    {
      name: 'lensnutra-meal-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
