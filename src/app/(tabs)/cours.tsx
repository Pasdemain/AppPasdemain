import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { LESSONS } from '@/data/lessons';
import { getTheme } from '@/data/themes';

export default function CoursScreen() {
  const router = useRouter();

  return (
    <Screen safeTop>
      <View style={styles.header}>
        <ThemedText type="title">Cours</ThemedText>
        <ThemedText color="textSecondary">
          Les neuf thèmes du programme, à lire dans l’ordre ou à piocher selon vos lacunes.
        </ThemedText>
      </View>

      {LESSONS.map((lesson) => {
        const theme = getTheme(lesson.id);
        return (
          <Card key={lesson.id} onPress={() => router.push(`/cours/${lesson.id}`)}>
            <ThemedText type="label" color="textSecondary">
              {theme.emoji} {theme.label} · {lesson.readingMinutes} min
            </ThemedText>
            <ThemedText type="heading">{lesson.title}</ThemedText>
            <ThemedText type="small" color="textSecondary">
              {lesson.summary}
            </ThemedText>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
});
