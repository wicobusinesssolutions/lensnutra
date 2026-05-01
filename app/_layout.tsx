import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useThemeStore } from '@/store/themeStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();

  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS === 'web') return;
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    }
    requestPermissions();

    // Handle notifications when app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // Handle notification taps
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'meal_reminder') {
        router.push('/camera');
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

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
        <Stack.Screen name="notifications-settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="help-center" options={{ presentation: 'card' }} />
        <Stack.Screen name="privacy-policy" options={{ presentation: 'card' }} />
        <Stack.Screen name="about" options={{ presentation: 'card' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </>
  );
}
