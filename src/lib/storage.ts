import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Petit wrapper JSON autour d'AsyncStorage. La persistance ne doit jamais
 * faire planter l'app : en cas d'erreur on retombe sur la valeur par défaut.
 */
export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Stockage indisponible : la session reste utilisable en mémoire.
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignoré volontairement.
  }
}
