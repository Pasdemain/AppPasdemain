import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        // Chaque onglet affiche son propre titre dans le contenu : un en-tête
        // de navigation en plus ferait doublon.
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚓️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cours"
        options={{
          title: 'Cours',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📘" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="entrainement"
        options={{
          title: 'Entraînement',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progres"
        options={{
          title: 'Progrès',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📈" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
