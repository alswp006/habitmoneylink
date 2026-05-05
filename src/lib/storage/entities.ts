import type { Habit, CheckIn, Goal, Badge, AppSettings } from '@/lib/types';
import { readRaw, safeJsonParse, safeSetItem } from '@/lib/storage/base';
import { HABITS_KEY, CHECKINS_KEY, GOALS_KEY, BADGES_KEY, SETTINGS_KEY } from '@/lib/storage/keys';
import { validateHabits, validateCheckIns, validateGoals, validateBadges, validateSettings } from '@/lib/storage/validate';

// ─── Habits ──────────────────────────────────────────────────────────────────

export function getHabits(): Habit[] {
  const raw = readRaw(HABITS_KEY);
  if (raw === null) return [];
  const parsed = safeJsonParse<unknown>(HABITS_KEY, raw);
  return validateHabits(parsed, HABITS_KEY);
}

export function setHabits(next: Habit[]): void {
  safeSetItem(HABITS_KEY, JSON.stringify(next));
}

// ─── CheckIns ────────────────────────────────────────────────────────────────

export function getCheckIns(): CheckIn[] {
  const raw = readRaw(CHECKINS_KEY);
  if (raw === null) return [];
  const parsed = safeJsonParse<unknown>(CHECKINS_KEY, raw);
  return validateCheckIns(parsed, CHECKINS_KEY);
}

export function setCheckIns(next: CheckIn[]): void {
  safeSetItem(CHECKINS_KEY, JSON.stringify(next));
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export function getGoals(): Goal[] {
  const raw = readRaw(GOALS_KEY);
  if (raw === null) return [];
  const parsed = safeJsonParse<unknown>(GOALS_KEY, raw);
  return validateGoals(parsed, GOALS_KEY);
}

export function setGoals(next: Goal[]): void {
  safeSetItem(GOALS_KEY, JSON.stringify(next));
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export function getBadges(): Badge[] {
  const raw = readRaw(BADGES_KEY);
  if (raw === null) return [];
  const parsed = safeJsonParse<unknown>(BADGES_KEY, raw);
  return validateBadges(parsed, BADGES_KEY);
}

export function setBadges(next: Badge[]): void {
  safeSetItem(BADGES_KEY, JSON.stringify(next));
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function getSettings(): AppSettings | null {
  const raw = readRaw(SETTINGS_KEY);
  if (raw === null) return null;
  const parsed = safeJsonParse<unknown>(SETTINGS_KEY, raw);
  return validateSettings(parsed, SETTINGS_KEY);
}

export function setSettings(next: AppSettings): void {
  safeSetItem(SETTINGS_KEY, JSON.stringify(next));
}
