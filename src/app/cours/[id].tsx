import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getLesson } from '@/data/lessons';
import { getTheme } from '@/data/themes';
import { useTheme } from '@/hooks/use-theme';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const palette = useTheme();
  const lesson = getLesson(id);

  if (!lesson) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Cours' }} />
        <ThemedText type="subtitle">Cours introuvable</ThemedText>
        <ThemedText color="textSecondary">
          Ce cours n’existe pas ou n’est plus disponible.
        </ThemedText>
        <Button variant="secondary" label="Retour aux cours" onPress={() => router.back()} />
      </Screen>
    );
  }

  const meta = getTheme(lesson.id);

  return (
    <Screen>
      <Stack.Screen options={{ title: meta.label }} />

      <View style={styles.header}>
        <ThemedText type="label" color="textSecondary">
          {meta.emoji} {lesson.readingMinutes} min de lecture
        </ThemedText>
        <ThemedText type="title">{lesson.title}</ThemedText>
        <ThemedText color="textSecondary">{lesson.summary}</ThemedText>
      </View>

      {lesson.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <ThemedText type="subtitle">{section.heading}</ThemedText>
          {section.body.map((paragraph, index) => (
            <ThemedText key={index}>{paragraph}</ThemedText>
          ))}
          {section.keyPoints && (
            <View
              style={[
                styles.keyPoints,
                { backgroundColor: palette.surfaceAlt, borderLeftColor: palette.accent },
              ]}>
              <ThemedText type="label" color="textSecondary">
                À retenir
              </ThemedText>
              {section.keyPoints.map((point) => (
                <ThemedText key={point} type="small">
                  • {point}
                </ThemedText>
              ))}
            </View>
          )}
        </View>
      ))}

      <Card>
        <ThemedText type="heading">Vérifier ses acquis</ThemedText>
        <ThemedText type="small" color="textSecondary">
          Enchaînez avec une série de questions sur ce thème pendant que le cours est frais.
        </ThemedText>
        <Button
          label="Lancer la série"
          onPress={() => router.push(`/quiz/${lesson.id}`)}
          style={styles.cta}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
  section: { gap: Spacing.md },
  keyPoints: {
    gap: Spacing.xs,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
  },
  cta: { marginTop: Spacing.sm },
});
