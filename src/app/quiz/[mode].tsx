import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AnswerOption } from '@/components/answer-option';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { EXAM_MAX_ERRORS } from '@/data/questions';
import { getTheme, THEMES } from '@/data/themes';
import { useProgress, useReviewQuestionIds } from '@/hooks/use-progress';
import { useTheme } from '@/hooks/use-theme';
import { buildQuiz, parseMode, type PreparedQuestion } from '@/lib/quiz';

type Answered = { question: PreparedQuestion; chosen: number; correct: boolean };

function titleForMode(mode: string | undefined): string {
  if (mode === 'exam') return 'Examen blanc';
  if (mode === 'review') return 'Mes erreurs';
  const theme = THEMES.find((item) => item.id === mode);
  return theme ? theme.label : 'Entraînement';
}

function tapFeedback(correct: boolean) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {
    // Le retour haptique est un confort, jamais une condition de fonctionnement.
  });
}

export default function QuizScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const router = useRouter();
  const palette = useTheme();
  const { recordAnswer, recordExam } = useProgress();
  const reviewIds = useReviewQuestionIds();

  // La série est constituée une seule fois : les identifiants de révision
  // changent au fur et à mesure des réponses, on ne veut pas la reconstruire.
  const [seed, setSeed] = useState(0);
  const questions = useMemo(() => {
    const parsed = parseMode(mode, reviewIds);
    return parsed ? buildQuiz(parsed) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, seed]);

  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [finished, setFinished] = useState(false);

  const isExam = mode === 'exam';
  const current = questions[index];
  const correctCount = answers.filter((answer) => answer.correct).length;

  const restart = useCallback(() => {
    setSeed((value) => value + 1);
    setIndex(0);
    setChosen(null);
    setAnswers([]);
    setFinished(false);
  }, []);

  const select = useCallback(
    (choice: number) => {
      if (chosen !== null || !current) return;
      const correct = choice === current.answer;
      setChosen(choice);
      setAnswers((previous) => [...previous, { question: current, chosen: choice, correct }]);
      recordAnswer(current.id, correct);
      tapFeedback(correct);
    },
    [chosen, current, recordAnswer],
  );

  const next = useCallback(() => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setChosen(null);
      return;
    }

    if (isExam) {
      const total = questions.length;
      const correct = answers.filter((answer) => answer.correct).length;
      recordExam({ total, correct, passed: total - correct <= EXAM_MAX_ERRORS });
    }
    setFinished(true);
  }, [answers, index, isExam, questions.length, recordExam]);

  if (questions.length === 0) {
    return (
      <Screen>
        <Stack.Screen options={{ title: titleForMode(mode) }} />
        <ThemedText type="subtitle">Rien à réviser</ThemedText>
        <ThemedText color="textSecondary">
          Cette série est vide. Travaillez d’abord quelques questions pour alimenter vos révisions.
        </ThemedText>
        <Button variant="secondary" label="Retour" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (finished) {
    const total = questions.length;
    const errors = total - correctCount;
    const criticalMissed = answers.filter((answer) => !answer.correct && answer.question.critical);
    const passed = isExam ? errors <= EXAM_MAX_ERRORS && criticalMissed.length === 0 : errors === 0;
    const missed = answers.filter((answer) => !answer.correct);

    return (
      <Screen>
        <Stack.Screen
          options={{
            title: titleForMode(mode),
            headerRight: () => (
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <ThemedText style={{ color: palette.primary }}>Fermer</ThemedText>
              </Pressable>
            ),
          }}
        />

        <Card>
          <ThemedText type="label" color="textSecondary">
            Résultat
          </ThemedText>
          <ThemedText type="title">
            {correctCount} / {total}
          </ThemedText>
          <ProgressBar
            value={total === 0 ? 0 : correctCount / total}
            color={passed ? palette.success : palette.danger}
          />
          {isExam && (
            <View
              style={[
                styles.verdict,
                { backgroundColor: passed ? palette.successSurface : palette.dangerSurface },
              ]}>
              <ThemedText
                type="heading"
                style={{ color: passed ? palette.success : palette.danger }}>
                {passed ? 'Admis' : 'Refusé'}
              </ThemedText>
              <ThemedText type="small" color="textSecondary">
                {errors} faute{errors > 1 ? 's' : ''} sur {EXAM_MAX_ERRORS} autorisée
                {EXAM_MAX_ERRORS > 1 ? 's' : ''}
                {criticalMissed.length > 0
                  ? ` · ${criticalMissed.length} erreur${criticalMissed.length > 1 ? 's' : ''} éliminatoire${criticalMissed.length > 1 ? 's' : ''}`
                  : ''}
                .
              </ThemedText>
            </View>
          )}
        </Card>

        {missed.length > 0 && (
          <>
            <ThemedText type="label" color="textSecondary">
              À revoir
            </ThemedText>
            {missed.map((answer) => (
              <Card key={answer.question.id}>
                <ThemedText type="label" color="textSecondary">
                  {getTheme(answer.question.theme).label}
                  {answer.question.critical ? ' · sécurité' : ''}
                </ThemedText>
                <ThemedText type="heading">{answer.question.prompt}</ThemedText>
                <ThemedText type="small" style={{ color: palette.success }}>
                  Bonne réponse : {answer.question.choices[answer.question.answer]}
                </ThemedText>
                <ThemedText type="small" color="textSecondary">
                  {answer.question.explanation}
                </ThemedText>
              </Card>
            ))}
          </>
        )}

        <Button label="Recommencer" onPress={restart} />
        <Button variant="secondary" label="Terminer" onPress={() => router.back()} />
      </Screen>
    );
  }

  const revealed = chosen !== null;

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <Stack.Screen
        options={{
          title: titleForMode(mode),
          headerRight: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ThemedText style={{ color: palette.primary }}>Quitter</ThemedText>
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <View style={styles.meta}>
            <ThemedText type="label" color="textSecondary">
              Question {index + 1} / {questions.length}
            </ThemedText>
            <ThemedText type="label" color="textSecondary">
              {getTheme(current.theme).label}
            </ThemedText>
          </View>
          <ProgressBar value={(index + (revealed ? 1 : 0)) / questions.length} height={5} />

          {current.critical && (
            <View style={[styles.criticalTag, { backgroundColor: palette.surfaceAlt }]}>
              <ThemedText type="small" style={{ color: palette.warning, fontWeight: '700' }}>
                Question de sécurité · une erreur est éliminatoire
              </ThemedText>
            </View>
          )}

          <ThemedText type="subtitle">{current.prompt}</ThemedText>

          <View style={styles.options}>
            {current.choices.map((choice, choiceIndex) => (
              <AnswerOption
                key={choice}
                label={choice}
                index={choiceIndex}
                revealed={revealed}
                isCorrect={choiceIndex === current.answer}
                isSelected={choiceIndex === chosen}
                onPress={() => select(choiceIndex)}
              />
            ))}
          </View>

          {revealed && (
            <Card>
              <ThemedText
                type="heading"
                style={{ color: chosen === current.answer ? palette.success : palette.danger }}>
                {chosen === current.answer ? 'Bonne réponse' : 'Réponse incorrecte'}
              </ThemedText>
              <ThemedText type="small" color="textSecondary">
                {current.explanation}
              </ThemedText>
            </Card>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
        <View style={styles.footerInner}>
          <Button
            label={index + 1 < questions.length ? 'Question suivante' : 'Voir le résultat'}
            disabled={!revealed}
            onPress={next}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { alignItems: 'center', paddingVertical: Spacing.lg, paddingBottom: Spacing.xxl },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  criticalTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  options: { gap: Spacing.md },
  verdict: { padding: Spacing.lg, borderRadius: Radius.md, gap: Spacing.xs },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  footerInner: { width: '100%', maxWidth: MaxContentWidth },
});
