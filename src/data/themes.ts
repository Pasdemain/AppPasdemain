/**
 * Les neuf thèmes du programme du permis plaisance option côtière.
 * L'identifiant est utilisé comme clé de progression, il ne doit pas changer.
 */
export const THEMES = [
  { id: 'balisage', label: 'Balisage', full: 'Balisage et signalisation maritime', emoji: '🚩' },
  { id: 'barre', label: 'Règles de barre', full: 'Règles de barre et de route', emoji: '⛵️' },
  { id: 'feux', label: 'Feux et marques', full: 'Feux, marques et silhouettes', emoji: '🔦' },
  { id: 'sonores', label: 'Signaux sonores', full: 'Signaux sonores et visibilité réduite', emoji: '📣' },
  { id: 'securite', label: 'Sécurité', full: 'Sécurité et matériel d’armement', emoji: '🦺' },
  { id: 'meteo', label: 'Météo et marées', full: 'Météorologie, marées et courants', emoji: '🌊' },
  { id: 'radio', label: 'Radio VHF', full: 'Radiotéléphonie VHF et ASN', emoji: '📻' },
  { id: 'reglementation', label: 'Réglementation', full: 'Réglementation et environnement', emoji: '⚖️' },
  { id: 'navigation', label: 'Navigation', full: 'Cartographie et navigation', emoji: '🧭' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const BY_ID = new Map(THEMES.map((theme) => [theme.id, theme]));

export function getTheme(id: ThemeId) {
  const theme = BY_ID.get(id);
  if (!theme) throw new Error(`Thème inconnu : ${id}`);
  return theme;
}
