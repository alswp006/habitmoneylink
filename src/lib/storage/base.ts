import { StorageError } from '@/lib/types';

export function readRaw(key: string): string | null {
  return localStorage.getItem(key);
}

export function safeJsonParse<T>(key: string, raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (cause) {
    throw new StorageError({ code: 'PARSE_ERROR', key, message: `Failed to parse JSON for key "${key}"`, cause });
  }
}

export function safeSetItem(key: string, valueString: string): void {
  try {
    localStorage.setItem(key, valueString);
  } catch (cause) {
    throw new StorageError({ code: 'QUOTA_EXCEEDED', key, message: `Storage quota exceeded for key "${key}"`, cause });
  }
}
