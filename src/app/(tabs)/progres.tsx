import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getTheme } from '@/data/themes';
import { useGlobalStats, useProgress, useThemeStats } from '@/hooks/use-progress';
import { useTheme } from '@/hooks/use-theme';

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ProgresScreen() {
  const palette = useTheme();
  const stats = useGlobalStats();
  const themeStats = useThemeStats();
  const { reset } = useProgress();

  function confirmReset() {
    // Alert.alert n'affiche rien sur le web : on y utilise confirm().
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (typeof confirm === 'function' && confirm('Effacer toute votre progression ?')) reset();
      return;
    }
    Alert.alert(
      'Réinitialiser la progression',
      'Vos statistiques et vos examens blancs seront effacés. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Effacer', style: 'destructive', onPress: reset },
      ],
    );
  }

  return (
    <Screen safeTop>
      <View style={styles.header}>
        <ThemedText type="title">Progrès</ThemedText>
        <ThemedText color="textSecondary">
          Votre niveau thème par thème et l’historique de vos examens blancs.
        </ThemedText>
      </View>

      <Card>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <ThemedText type="subtitle">{Math.round(stats.accuracy * 100)} %</ThemedText>
            <ThemedText type="small" color="textSecondary">
              de réussite
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText type="subtitle">{stats.mastered}</ThemedText>
            <ThemedText type="small" color="textSecondary">
              questions acquises
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText type="subtitle">{stats.attempts}</ThemedText>
            <ThemedText type="small" color="textSecondary">
              réponses données
            </ThemedText>
          </View>
        </View>
      </Card>

      <ThemedText type="label" color="textSecondary">
        Par thème
      </ThemedText>

      <Card>
        {themeStats.map((stat, index) => {
          const meta = getTheme(stat.theme);
          const color =
            stat.seen === 0
              ? palette.border
              : stat.accuracy >= 0.8
                ? palette.success
                : stat.accuracy >= 0.5
                  ? palette.warning
                  : palette.danger;

          return (
            <View
              key={stat.theme}
              style={[styles.themeRow, index > 0 && { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <View style={styles.row}>
                <ThemedText style={styles.grow}>
                  {meta.emoji} {meta.label}
                </ThemedText>
                <ThemedText type="small" color="textSecondary">
                  {stat.seen === 0 ? '—' : `${Math.round(stat.accuracy * 100)} %`}
                </ThemedText>
              </View>
              <ProgressBar value={stat.accuracy} color={color} height={6} />
            </View>
          );
        })}
      </Card>

      <ThemedText type="label" color="textSecondary">
        Examens blancs
      </ThemedText>

      {stats.exams.length === 0 ? (
        <Card>
          <ThemedText type="small" color="textSecondary">
            Aucun examen blanc terminé pour l’instant.
          </ThemedText>
        </Card>
      ) : (
        <Card>
          {stats.exams.map((exam, index) => (
            <View
              key={`${exam.date}-${index}`}
              style={[
                styles.examRow,
                index > 0 && { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth },
              ]}>
              <ThemedText type="small" color="textSecondary" style={styles.grow}>
                {formatDate(exam.date)}
              </ThemedText>
              <ThemedText type="small">
                {exam.correct} / {exam.total}
              </ThemedText>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: exam.passed ? palette.successSurface : palette.dangerSurface },
                ]}>
                <ThemedText
                  type="small"
                  style={{ color: exam.passed ? palette.success : palette.danger, fontWeight: '700' }}>
                  {exam.passed ? 'Admis' : 'Refusé'}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>
      )}

      <Button variant="ghost" label="Réinitialiser ma progression" onPress={confirmReset} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  stat: { flex: 1, gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  grow: { flex: 1 },
  themeRow: { gap: Spacing.sm, paddingVertical: Spacing.md },
  examRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
});
