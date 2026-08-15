import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { QUESTIONS, questionsByTheme } from '@/data/questions';
import { THEMES, type ThemeId } from '@/data/themes';
import { loadJSON, removeKey, saveJSON } from '@/lib/storage';

const STORAGE_KEY = 'permis-bateau/progress/v1';

export type QuestionStat = {
  seen: number;
  correct: number;
  /** Vrai si la dernière tentative était juste. Sert à constituer les révisions. */
  lastCorrect: boolean;
};

export type ExamResult = {
  /** Horodatage ISO de la fin de l'examen. */
  date: string;
  total: number;
  correct: number;
  passed: boolean;
};

type ProgressState = {
  questions: Record<string, QuestionStat>;
  exams: ExamResult[];
};

const EMPTY: ProgressState = { questions: {}, exams: [] };

type ProgressContextValue = {
  state: ProgressState;
  /** Vrai tant que la progression n'a pas été relue depuis le stockage. */
  loading: boolean;
  recordAnswer: (questionId: string, correct: boolean) => void;
  recordExam: (result: Omit<ExamResult, 'date'>) => void;
  reset: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadJSON<ProgressState>(STORAGE_KEY, EMPTY).then((stored) => {
      if (cancelled) return;
      setState({ questions: stored.questions ?? {}, exams: stored.exams ?? [] });
      hydrated.current = true;
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // On n'écrit qu'après l'hydratation, sinon le premier rendu écraserait le stockage.
  useEffect(() => {
    if (!hydrated.current) return;
    saveJSON(STORAGE_KEY, state);
  }, [state]);

  const recordAnswer = useCallback((questionId: string, correct: boolean) => {
    setState((previous) => {
      const current = previous.questions[questionId] ?? { seen: 0, correct: 0, lastCorrect: false };
      return {
        ...previous,
        questions: {
          ...previous.questions,
          [questionId]: {
            seen: current.seen + 1,
            correct: current.correct + (correct ? 1 : 0),
            lastCorrect: correct,
          },
        },
      };
    });
  }, []);

  const recordExam = useCallback((result: Omit<ExamResult, 'date'>) => {
    setState((previous) => ({
      ...previous,
      // On conserve les 20 derniers examens, suffisant pour la courbe de progression.
      exams: [{ ...result, date: new Date().toISOString() }, ...previous.exams].slice(0, 20),
    }));
  }, []);

  const reset = useCallback(() => {
    setState(EMPTY);
    removeKey(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ state, loading, recordAnswer, recordExam, reset }),
    [state, loading, recordAnswer, recordExam, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress doit être utilisé à l’intérieur de <ProgressProvider>.');
  }
  return context;
}

export type ThemeStat = {
  theme: ThemeId;
  total: number;
  seen: number;
  /** Taux de réussite cumulé sur les questions déjà vues, entre 0 et 1. */
  accuracy: number;
};

export function useThemeStats(): ThemeStat[] {
  const { state } = useProgress();

  return useMemo(
    () =>
      THEMES.map((theme) => {
        const questions = questionsByTheme(theme.id);
        let seen = 0;
        let attempts = 0;
        let correct = 0;

        for (const question of questions) {
          const stat = state.questions[question.id];
          if (!stat) continue;
          seen += 1;
          attempts += stat.seen;
          correct += stat.correct;
        }

        return {
          theme: theme.id,
          total: questions.length,
          seen,
          accuracy: attempts === 0 ? 0 : correct / attempts,
        };
      }),
    [state.questions],
  );
}

/** Identifiants des questions ratées à la dernière tentative. */
export function useReviewQuestionIds(): string[] {
  const { state } = useProgress();

  return useMemo(
    () =>
      QUESTIONS.filter((question) => {
        const stat = state.questions[question.id];
        return stat != null && !stat.lastCorrect;
      }).map((question) => question.id),
    [state.questions],
  );
}

export function useGlobalStats() {
  const { state } = useProgress();

  return useMemo(() => {
    const stats = Object.values(state.questions);
    const attempts = stats.reduce((sum, stat) => sum + stat.seen, 0);
    const correct = stats.reduce((sum, stat) => sum + stat.correct, 0);
    const mastered = stats.filter((stat) => stat.lastCorrect).length;

    return {
      questionsSeen: stats.length,
      questionsTotal: QUESTIONS.length,
      attempts,
      accuracy: attempts === 0 ? 0 : correct / attempts,
      mastered,
      exams: state.exams,
      examsPassed: state.exams.filter((exam) => exam.passed).length,
    };
  }, [state]);
}
