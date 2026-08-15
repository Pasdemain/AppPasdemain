import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AnswerOptionProps = {
  label: string;
  index: number;
  /** Vrai une fois la réponse validée : les couleurs de correction s'appliquent. */
  revealed: boolean;
  isCorrect: boolean;
  isSelected: boolean;
  onPress: () => void;
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function AnswerOption({
  label,
  index,
  revealed,
  isCorrect,
  isSelected,
  onPress,
}: AnswerOptionProps) {
  const theme = useTheme();

  let borderColor = theme.border;
  let backgroundColor = theme.surface;

  if (revealed && isCorrect) {
    borderColor = theme.success;
    backgroundColor = theme.successSurface;
  } else if (revealed && isSelected) {
    borderColor = theme.danger;
    backgroundColor = theme.dangerSurface;
  } else if (isSelected) {
    borderColor = theme.accent;
    backgroundColor = theme.surfaceAlt;
  }

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected, disabled: revealed }}
      disabled={revealed}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { borderColor, backgroundColor },
        pressed && !revealed && styles.pressed,
      ]}>
      <View style={[styles.letter, { borderColor }]}>
        <ThemedText type="small" style={styles.letterText}>
          {LETTERS[index] ?? String(index + 1)}
        </ThemedText>
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  pressed: { opacity: 0.7 },
  letter: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: { fontWeight: '700' },
  label: { flex: 1 },
});
