import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useThemeStore } from '@/store/themeStore';

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...MaterialCommunityIcons.font,
    ...FontAwesome.font,
    ...FontAwesome5.font,
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const reported = new Set();
    const send = (name: string, message: string, stack: string, type: string) => {
      const key = message + stack;
      if (reported.has(key)) return;
      reported.add(key);
      try {
        window.parent.postMessage({
          type: 'flexbuild-preview-error',
          error: {
            type,
            title: name || 'Error',
            message,
            stack,
            location: '',
            timestamp: new Date().toISOString(),
            suggestions: [
              'Check the error message and stack trace',
              'Verify babel.config.js includes react-native-reanimated/plugin as last plugin',
              'Ensure GestureHandlerRootView wraps the root layout when using gesture-handler',
              'Review all imports and package versions',
            ],
          },
        }, '*');
      } catch {}
    };

    const onError = (e: ErrorEvent) => {
      if (e.error) send(e.error.name, e.error.message, e.error.stack || '', 'runtime');
    };
    const onReject = (e: PromiseRejectionEvent) => {
      const v = e.reason;
      if (v instanceof Error) send(v.name, v.message, v.stack || '', 'promise');
      else send('UnhandledRejection', String(v), '', 'promise');
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onReject);

    const observer = new MutationObserver(() => {
      const text = document.body?.innerText || '';
      if (
        text.includes('Uncaught Error') ||
        text.includes('getEnforcing') ||
        document.body?.querySelector('[data-testid="LogBox"]') ||
        document.body?.querySelector('[aria-label="LogBox"]')
      ) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const idx = lines.indexOf('Uncaught Error');
        const message = idx >= 0 ? lines[idx + 1] : (lines[0] || 'Metro runtime error');
        send('RuntimeError', message, text.slice(0, 1000), 'runtime');
      }
    });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onReject);
      observer.disconnect();
    };
  }, []);

  const { isDarkMode } = useThemeStore();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="nutrition-detail" options={{ presentation: 'modal' }} />
        <Stack.Screen name="compare" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile-edit" options={{ presentation: 'card' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </>
  );
}
