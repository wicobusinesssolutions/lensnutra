import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserGoal = 'Weight Loss' | 'Muscle Gain' | 'Weight Gain';

interface UserProfile {
  name: string;
  email: string;
  weightKg: string;
  heightCm: string;
  goal: UserGoal;
  gender: string;
  hasCompletedOnboarding: boolean;
}

interface UserState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: {
        name: '',
        email: '',
        weightKg: '70',
        heightCm: '170',
        goal: 'Weight Loss',
        gender: 'Other',
        hasCompletedOnboarding: false,
      },
      completeOnboarding: () =>
        set((state) => ({
          profile: { ...state.profile, hasCompletedOnboarding: true },
        })),
      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
    }),
    {
      name: 'lensnutra-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
