import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ProgressProvider } from '@/hooks/use-progress';

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const palette = isDark ? Colors.dark : Colors.light;
  const base = isDark ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProgressProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="cours/[id]" options={{ title: 'Cours' }} />
            <Stack.Screen
              name="quiz/[mode]"
              options={{ title: 'Entraînement', headerBackVisible: false, gestureEnabled: false }}
            />
          </Stack>
        </ThemeProvider>
      </ProgressProvider>
    </GestureHandlerRootView>
  );
}
