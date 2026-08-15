import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { EXAM_LENGTH, EXAM_MAX_ERRORS } from '@/data/questions';
import { getTheme } from '@/data/themes';
import { useGlobalStats, useReviewQuestionIds, useThemeStats } from '@/hooks/use-progress';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const stats = useGlobalStats();
  const themeStats = useThemeStats();
  const reviewIds = useReviewQuestionIds();

  const coverage = stats.questionsTotal === 0 ? 0 : stats.questionsSeen / stats.questionsTotal;
  const lastExam = stats.exams[0];

  // Le thème le plus faible parmi ceux déjà travaillés : c'est la révision la plus utile.
  const weakest = themeStats
    .filter((item) => item.seen > 0)
    .sort((a, b) => a.accuracy - b.accuracy)[0];

  return (
    <Screen safeTop>
      <View style={styles.header}>
        <ThemedText type="label" color="textSecondary">
          Permis plaisance · option côtière
        </ThemedText>
        <ThemedText type="title">Prêt à embarquer&nbsp;?</ThemedText>
        <ThemedText color="textSecondary">
          {EXAM_LENGTH} questions à l’examen, {EXAM_MAX_ERRORS} fautes autorisées. Entraînez-vous
          jusqu’à ce que ce soit confortable.
        </ThemedText>
      </View>

      <Card>
        <ThemedText type="label" color="textSecondary">
          Couverture du programme
        </ThemedText>
        <ThemedText type="subtitle">
          {stats.questionsSeen} / {stats.questionsTotal}
        </ThemedText>
        <ProgressBar value={coverage} />
        <ThemedText type="small" color="textSecondary">
          {stats.attempts === 0
            ? 'Aucune question travaillée pour l’instant.'
            : `${Math.round(stats.accuracy * 100)} % de bonnes réponses sur ${stats.attempts} réponses données.`}
        </ThemedText>
      </Card>

      <View style={styles.actions}>
        <Button label="Lancer un examen blanc" onPress={() => router.push('/quiz/exam')} />
        {reviewIds.length > 0 && (
          <Button
            variant="secondary"
            label={`Réviser mes ${reviewIds.length} erreur${reviewIds.length > 1 ? 's' : ''}`}
            onPress={() => router.push('/quiz/review')}
          />
        )}
      </View>

      {lastExam && (
        <Card>
          <ThemedText type="label" color="textSecondary">
            Dernier examen blanc
          </ThemedText>
          <View style={styles.row}>
            <ThemedText type="subtitle">
              {lastExam.correct} / {lastExam.total}
            </ThemedText>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: lastExam.passed ? theme.successSurface : theme.dangerSurface,
                },
              ]}>
              <ThemedText
                type="small"
                style={{ color: lastExam.passed ? theme.success : theme.danger, fontWeight: '700' }}>
                {lastExam.passed ? 'Admis' : 'Refusé'}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="small" color="textSecondary">
            {stats.examsPassed} examen{stats.examsPassed > 1 ? 's' : ''} réussi
            {stats.examsPassed > 1 ? 's' : ''} sur {stats.exams.length} tenté
            {stats.exams.length > 1 ? 's' : ''}.
          </ThemedText>
        </Card>
      )}

      {weakest && weakest.accuracy < 0.8 && (
        <Card onPress={() => router.push(`/quiz/${weakest.theme}`)}>
          <ThemedText type="label" color="textSecondary">
            À travailler en priorité
          </ThemedText>
          <ThemedText type="heading">
            {getTheme(weakest.theme).emoji} {getTheme(weakest.theme).full}
          </ThemedText>
          <ThemedText type="small" color="textSecondary">
            {Math.round(weakest.accuracy * 100)} % de réussite. Touchez pour lancer une série sur ce
            thème.
          </ThemedText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
  actions: { gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
});
