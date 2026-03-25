/**
 * Chunked SecureStore adapter for Supabase auth.
 *
 * expo-secure-store has a 2 KB per-key limit. Supabase session JSON can exceed
 * this, so we split values into 1800-byte chunks and reassemble on read.
 *
 * Uses iOS Keychain / Android Keystore — encrypted at rest, unlike AsyncStorage.
 */
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;

async function setItem(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    await SecureStore.deleteItemAsync(`${key}_count`).catch(() => null);
    return;
  }

  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk))
  );
  await SecureStore.setItemAsync(`${key}_count`, String(chunks.length));
  // Remove un-chunked key if it existed before
  await SecureStore.deleteItemAsync(key).catch(() => null);
}

async function getItem(key: string): Promise<string | null> {
  const countStr = await SecureStore.getItemAsync(`${key}_count`);
  if (!countStr) {
    return SecureStore.getItemAsync(key);
  }

  const count = parseInt(countStr, 10);
  const chunks = await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}_${i}`))
  );

  if (chunks.some((c) => c === null)) return null;
  return chunks.join('');
}

async function removeItem(key: string): Promise<void> {
  const countStr = await SecureStore.getItemAsync(`${key}_count`);
  if (countStr) {
    const count = parseInt(countStr, 10);
    await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}_${i}`).catch(() => null)
      )
    );
    await SecureStore.deleteItemAsync(`${key}_count`).catch(() => null);
  } else {
    await SecureStore.deleteItemAsync(key).catch(() => null);
  }
}

export const secureStorage = { getItem, setItem, removeItem };
