import { EXAM_LENGTH, QUESTIONS, questionsByTheme, type Question } from '@/data/questions';
import { THEMES, type ThemeId } from '@/data/themes';

/** Question prête à être affichée : les réponses ont été mélangées. */
export type PreparedQuestion = {
  id: string;
  theme: ThemeId;
  prompt: string;
  choices: string[];
  /** Index de la bonne réponse après mélange. */
  answer: number;
  explanation: string;
  critical: boolean;
};

export type QuizMode =
  | { kind: 'exam' }
  | { kind: 'theme'; theme: ThemeId }
  | { kind: 'review'; questionIds: string[] };

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Mélange les propositions et recalcule l'index de la bonne réponse.
 * Sans cela, la bonne réponse resterait toujours à la même place.
 */
export function prepareQuestion(question: Question): PreparedQuestion {
  const correct = question.choices[question.answer];
  const choices = shuffle(question.choices);

  return {
    id: question.id,
    theme: question.theme,
    prompt: question.prompt,
    choices,
    answer: choices.indexOf(correct),
    explanation: question.explanation,
    critical: question.critical ?? false,
  };
}

/**
 * Constitue un examen blanc de 30 questions en piochant équitablement dans
 * chaque thème, puis en complétant au hasard.
 */
function buildExam(): Question[] {
  const perTheme = Math.floor(EXAM_LENGTH / THEMES.length);
  const picked: Question[] = [];
  const used = new Set<string>();

  for (const theme of THEMES) {
    for (const question of shuffle(questionsByTheme(theme.id)).slice(0, perTheme)) {
      picked.push(question);
      used.add(question.id);
    }
  }

  const remaining = shuffle(QUESTIONS.filter((question) => !used.has(question.id)));
  picked.push(...remaining.slice(0, Math.max(0, EXAM_LENGTH - picked.length)));

  return shuffle(picked).slice(0, EXAM_LENGTH);
}

export function buildQuiz(mode: QuizMode): PreparedQuestion[] {
  let pool: Question[];

  switch (mode.kind) {
    case 'exam':
      pool = buildExam();
      break;
    case 'theme':
      pool = shuffle(questionsByTheme(mode.theme));
      break;
    case 'review': {
      const wanted = new Set(mode.questionIds);
      pool = shuffle(QUESTIONS.filter((question) => wanted.has(question.id)));
      break;
    }
  }

  return pool.map(prepareQuestion);
}

/** Décrit un mode de quiz à partir des paramètres de route. */
export function parseMode(mode: string | undefined, reviewIds: string[]): QuizMode | null {
  if (!mode) return null;
  if (mode === 'exam') return { kind: 'exam' };
  if (mode === 'review') {
    return reviewIds.length > 0 ? { kind: 'review', questionIds: reviewIds } : null;
  }
  const theme = THEMES.find((item) => item.id === mode);
  return theme ? { kind: 'theme', theme: theme.id } : null;
}
