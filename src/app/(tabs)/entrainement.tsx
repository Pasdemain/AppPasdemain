import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { EXAM_LENGTH, EXAM_MAX_ERRORS, questionsByTheme } from '@/data/questions';
import { getTheme, THEMES } from '@/data/themes';
import { useReviewQuestionIds, useThemeStats } from '@/hooks/use-progress';
import { useTheme } from '@/hooks/use-theme';

export default function EntrainementScreen() {
  const router = useRouter();
  const palette = useTheme();
  const themeStats = useThemeStats();
  const reviewIds = useReviewQuestionIds();

  const statByTheme = new Map(themeStats.map((stat) => [stat.theme, stat]));

  return (
    <Screen safeTop>
      <View style={styles.header}>
        <ThemedText type="title">Entraînement</ThemedText>
        <ThemedText color="textSecondary">
          Un examen blanc pour se tester en conditions réelles, des séries par thème pour progresser.
        </ThemedText>
      </View>

      <Card>
        <ThemedText type="heading">Examen blanc</ThemedText>
        <ThemedText type="small" color="textSecondary">
          {EXAM_LENGTH} questions tirées de l’ensemble du programme. Admis avec {EXAM_MAX_ERRORS}{' '}
          fautes au maximum, une erreur sur une question de sécurité étant éliminatoire.
        </ThemedText>
        <Button label="Commencer" onPress={() => router.push('/quiz/exam')} style={styles.cta} />
      </Card>

      <Card>
        <ThemedText type="heading">Mes erreurs</ThemedText>
        <ThemedText type="small" color="textSecondary">
          {reviewIds.length === 0
            ? 'Aucune erreur en attente. Répondez à quelques questions pour alimenter cette série.'
            : `${reviewIds.length} question${reviewIds.length > 1 ? 's' : ''} ratée${reviewIds.length > 1 ? 's' : ''} à la dernière tentative.`}
        </ThemedText>
        <Button
          variant="secondary"
          label="Réviser mes erreurs"
          disabled={reviewIds.length === 0}
          onPress={() => router.push('/quiz/review')}
          style={styles.cta}
        />
      </Card>

      <ThemedText type="label" color="textSecondary">
        Séries par thème
      </ThemedText>

      {THEMES.map((theme) => {
        const stat = statByTheme.get(theme.id);
        const count = questionsByTheme(theme.id).length;
        const accuracy = stat?.accuracy ?? 0;
        const barColor =
          (stat?.seen ?? 0) === 0
            ? palette.border
            : accuracy >= 0.8
              ? palette.success
              : accuracy >= 0.5
                ? palette.warning
                : palette.danger;

        return (
          <Card key={theme.id} onPress={() => router.push(`/quiz/${theme.id}`)}>
            <View style={styles.row}>
              <ThemedText type="heading" style={styles.grow}>
                {theme.emoji} {getTheme(theme.id).full}
              </ThemedText>
              <ThemedText type="small" color="textSecondary">
                {count} q.
              </ThemedText>
            </View>
            <ProgressBar value={accuracy} color={barColor} height={6} />
            <ThemedText type="small" color="textSecondary">
              {(stat?.seen ?? 0) === 0
                ? 'Jamais travaillé'
                : `${Math.round(accuracy * 100)} % de réussite · ${stat?.seen}/${count} questions vues`}
            </ThemedText>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
  cta: { marginTop: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  grow: { flexShrink: 1 },
});
