import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'lensnutra-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// 2026 Glassmorphism Color System
export const getThemeColors = (isDarkMode: boolean) => ({
  // Backgrounds
  background: isDarkMode ? '#000000' : '#F2F2F7',
  surface: isDarkMode ? '#1C1C1E' : '#FFFFFF',
  surfaceElevated: isDarkMode ? '#2C2C2E' : '#FFFFFF',
  
  // Cards — glass effect base
  card: isDarkMode ? 'rgba(28, 28, 30, 0.72)' : 'rgba(255, 255, 255, 0.72)',
  cardSolid: isDarkMode ? '#1C1C1E' : '#FFFFFF',
  
  // Text
  text: isDarkMode ? '#FFFFFF' : '#000000',
  textSecondary: '#8E8E93',
  textTertiary: isDarkMode ? '#48484A' : '#C7C7CC',
  
  // Accents
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  accent: '#FF9500',
  success: '#34C759',
  error: '#FF3B30',
  
  // Borders
  border: isDarkMode ? 'rgba(120, 120, 128, 0.24)' : 'rgba(120, 120, 128, 0.16)',
  divider: isDarkMode ? 'rgba(120, 120, 128, 0.20)' : 'rgba(120, 120, 128, 0.12)',
  
  // Glass specifics
  glass: isDarkMode ? 'rgba(28, 28, 30, 0.65)' : 'rgba(255, 255, 255, 0.65)',
  glassBorder: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.40)',
  glassHeavy: isDarkMode ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  
  // Tab bar
  tabBar: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  tint: isDarkMode ? '#FFFFFF' : '#007AFF',
});
