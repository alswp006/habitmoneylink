import { StorageError } from '@/lib/types';
import type { Habit, CheckIn, Goal, Badge, AppSettings } from '@/lib/types';

function hasStringId(item: unknown): boolean {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    typeof (item as Record<string, unknown>).id === 'string'
  );
}

function assertArray(value: unknown, key: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new StorageError({ code: 'SCHEMA_MISMATCH', key, message: `Expected array at "${key}"` });
  }
}

function assertAllHaveStringId(arr: unknown[], key: string): void {
  for (const item of arr) {
    if (!hasStringId(item)) {
      throw new StorageError({ code: 'SCHEMA_MISMATCH', key, message: `Item missing string id at "${key}"` });
    }
  }
}

export function validateHabits(value: unknown, key: string): Habit[] {
  assertArray(value, key);
  assertAllHaveStringId(value, key);
  return value as Habit[];
}

export function validateCheckIns(value: unknown, key: string): CheckIn[] {
  assertArray(value, key);
  assertAllHaveStringId(value, key);
  return value as CheckIn[];
}

export function validateGoals(value: unknown, key: string): Goal[] {
  assertArray(value, key);
  assertAllHaveStringId(value, key);
  const activeCount = (value as Array<Record<string, unknown>>).filter(
    (g) => g.isActive === true,
  ).length;
  if (activeCount > 1) {
    throw new StorageError({ code: 'SCHEMA_MISMATCH', key, message: `More than one active goal at "${key}"` });
  }
  return value as Goal[];
}

export function validateBadges(value: unknown, key: string): Badge[] {
  assertArray(value, key);
  assertAllHaveStringId(value, key);
  return value as Badge[];
}

export function validateSettings(value: unknown, key: string): AppSettings {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    typeof (value as Record<string, unknown>).id !== 'string'
  ) {
    throw new StorageError({ code: 'SCHEMA_MISMATCH', key, message: `Invalid settings schema at "${key}"` });
  }
  return value as AppSettings;
}
