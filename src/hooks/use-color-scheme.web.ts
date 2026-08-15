import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Le rendu statique du web est généré côté serveur, où la préférence de thème
 * est inconnue. On rend donc « light » au premier passage — comme le HTML
 * prérendu — puis la vraie valeur une fois l'hydratation terminée.
 */
export function useColorScheme() {
  const [hydrated, setHydrated] = useState(false);
  const colorScheme = useRNColorScheme();

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated ? colorScheme : 'light';
}
