import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  /** Passe à false pour un écran à hauteur fixe (session de quiz par exemple). */
  scroll?: boolean;
  /**
   * À activer sur les écrans sans en-tête de navigation : le contenu doit alors
   * éviter lui-même l'encoche et la barre d'état.
   */
  safeTop?: boolean;
  contentStyle?: ViewStyle;
};

/** Fond thématisé + colonne centrée et bornée, pour que l'app reste lisible sur tablette et web. */
export function Screen({ children, scroll = true, safeTop = false, contentStyle }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const paddingTop = safeTop ? insets.top + Spacing.md : Spacing.lg;

  if (!scroll) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, paddingTop }]}>
        <View style={[styles.column, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.scrollContent, { paddingTop }]}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.column, contentStyle]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: Spacing.xxl * 2,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
});
