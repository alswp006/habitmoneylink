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
import type { Habit, CheckIn, Goal, Badge, AppSettings, HabitCategory } from '@/lib/types';
import { StorageError } from '@/lib/types';
import {
  getHabits, setHabits,
  getCheckIns, setCheckIns,
  getGoals, setGoals,
  getBadges, setBadges,
  getSettings, setSettings,
} from '@/lib/storage/entities';
import { HABITS_KEY, CHECKINS_KEY, GOALS_KEY, BADGES_KEY, SETTINGS_KEY } from '@/lib/storage/keys';

// ─── State shape ──────────────────────────────────────────────────────────────

export interface AppStoreState {
  isHydrating: boolean;
  storageError: StorageError | null;
  habits: Habit[];
  checkIns: CheckIn[];
  goals: Goal[];
  badges: Badge[];
  settings: AppSettings | null;
  habitsById: Map<string, Habit>;
  checkInsByHabitId: Map<string, CheckIn[]>;
  checkInsByDate: Map<string, CheckIn[]>;
  checkInUniqSet: Set<string>;
  activeGoal: Goal | null;
}

export interface AppStoreContextValue extends AppStoreState {
  resetAll: () => void;
  createHabit: (input: { category: HabitCategory; title: string; unitPriceKRW: number }) => void;
  updateHabit: (habitId: string, patch: Partial<Pick<Habit, 'title' | 'unitPriceKRW' | 'isActive'>>) => void;
  deleteHabit: (habitId: string) => void;
  createCheckIn: (params: { habitId: string; date: string; savedAmountKRW: number }) => void;
  upsertActiveGoal: (params: { title: string; targetAmountKRW: number }) => void;
  unlockBadge: (badgeId: string, nowISO: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_DATA = {
  habits: [] as Habit[],
  checkIns: [] as CheckIn[],
  goals: [] as Goal[],
  badges: [] as Badge[],
  settings: null as AppSettings | null,
  habitsById: new Map<string, Habit>(),
  checkInsByHabitId: new Map<string, CheckIn[]>(),
  checkInsByDate: new Map<string, CheckIn[]>(),
  checkInUniqSet: new Set<string>(),
  activeGoal: null as Goal | null,
};

const INITIAL_STATE: AppStoreState = {
  isHydrating: true,
  storageError: null,
  ...EMPTY_DATA,
};

function buildIndexes(habits: Habit[], checkIns: CheckIn[]) {
  const habitsById = new Map(habits.map((h) => [h.id, h]));
  const checkInsByHabitId = new Map<string, CheckIn[]>();
  const checkInsByDate = new Map<string, CheckIn[]>();
  const checkInUniqSet = new Set<string>();

  for (const ci of checkIns) {
    const byHabit = checkInsByHabitId.get(ci.habitId) ?? [];
    byHabit.push(ci);
    checkInsByHabitId.set(ci.habitId, byHabit);

    const byDate = checkInsByDate.get(ci.date) ?? [];
    byDate.push(ci);
    checkInsByDate.set(ci.date, byDate);

    checkInUniqSet.add(`${ci.habitId}::${ci.date}`);
  }

  return { habitsById, checkInsByHabitId, checkInsByDate, checkInUniqSet };
}

type HydratedData = Omit<AppStoreState, 'isHydrating'>;

function hydrateFromStorage(): HydratedData {
  try {
    const habits = getHabits();
    const checkIns = getCheckIns();
    const goals = getGoals();
    const badges = getBadges();
    const settings = getSettings();

    const { habitsById, checkInsByHabitId, checkInsByDate, checkInUniqSet } =
      buildIndexes(habits, checkIns);

    for (const ci of checkIns) {
      if (!habitsById.has(ci.habitId)) {
        throw new StorageError({
          code: 'SCHEMA_MISMATCH',
          key: CHECKINS_KEY,
          message: `CheckIn "${ci.id}" references missing habit "${ci.habitId}"`,
        });
      }
    }

    const activeGoal = goals.find((g) => g.isActive) ?? null;

    return {
      storageError: null,
      habits,
      checkIns,
      goals,
      badges,
      settings,
      habitsById,
      checkInsByHabitId,
      checkInsByDate,
      checkInUniqSet,
      activeGoal,
    };
  } catch (e) {
    const storageError =
      e instanceof StorageError
        ? e
        : new StorageError({ code: 'PARSE_ERROR', key: '', message: String(e) });
    return { storageError, ...EMPTY_DATA };
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppStoreState>(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  const refresh = useCallback(() => {
    const data = hydrateFromStorage();
    const next: AppStoreState = { isHydrating: false, ...data };
    stateRef.current = next;
    setStateRaw(next);
  }, []);

  useEffect(() => {
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const resetAll = useCallback(() => {
    localStorage.removeItem(HABITS_KEY);
    localStorage.removeItem(CHECKINS_KEY);
    localStorage.removeItem(GOALS_KEY);
    localStorage.removeItem(BADGES_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    refresh();
  }, [refresh]);

  const createHabit = useCallback(
    (input: { category: HabitCategory; title: string; unitPriceKRW: number }) => {
      const now = new Date().toISOString();
      const habit: Habit = {
        id: crypto.randomUUID(),
        ...input,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      setHabits([...stateRef.current.habits, habit]);
      refresh();
    },
    [refresh],
  );

  const updateHabit = useCallback(
    (
      habitId: string,
      patch: Partial<Pick<Habit, 'title' | 'unitPriceKRW' | 'isActive'>>,
    ) => {
      const now = new Date().toISOString();
      const newHabits = stateRef.current.habits.map((h) =>
        h.id === habitId ? { ...h, ...patch, updatedAt: now } : h,
      );
      setHabits(newHabits);
      refresh();
    },
    [refresh],
  );

  const deleteHabit = useCallback(
    (habitId: string) => {
      const s = stateRef.current;
      setHabits(s.habits.filter((h) => h.id !== habitId));
      setCheckIns(s.checkIns.filter((ci) => ci.habitId !== habitId));
      refresh();
    },
    [refresh],
  );

  const createCheckIn = useCallback(
    ({
      habitId,
      date,
      savedAmountKRW,
    }: {
      habitId: string;
      date: string;
      savedAmountKRW: number;
    }) => {
      const s = stateRef.current;
      const habit = s.habitsById.get(habitId);
      if (!habit || !habit.isActive) {
        throw new StorageError({
          code: 'INVALID_REF',
          key: CHECKINS_KEY,
          message: `Habit "${habitId}" not found or inactive`,
        });
      }
      if (s.checkInUniqSet.has(`${habitId}::${date}`)) {
        throw new StorageError({
          code: 'DUPLICATE',
          key: CHECKINS_KEY,
          message: `CheckIn already exists for habit "${habitId}" on "${date}"`,
        });
      }
      const now = new Date().toISOString();
      const ci: CheckIn = {
        id: crypto.randomUUID(),
        habitId,
        date,
        savedAmountKRW,
        createdAt: now,
        updatedAt: now,
      };
      setCheckIns([...s.checkIns, ci]);
      refresh();
    },
    [refresh],
  );

  const upsertActiveGoal = useCallback(
    ({ title, targetAmountKRW }: { title: string; targetAmountKRW: number }) => {
      const s = stateRef.current;
      const now = new Date().toISOString();
      let newGoals: Goal[];
      if (s.activeGoal) {
        newGoals = s.goals.map((g) =>
          g.id === s.activeGoal!.id
            ? { ...g, title, targetAmountKRW, updatedAt: now }
            : g,
        );
      } else {
        const newGoal: Goal = {
          id: crypto.randomUUID(),
          title,
          targetAmountKRW,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
        newGoals = [...s.goals, newGoal];
      }
      setGoals(newGoals);
      refresh();
    },
    [refresh],
  );

  const unlockBadge = useCallback(
    (badgeId: string, nowISO: string) => {
      const s = stateRef.current;
      const badge = s.badges.find((b) => b.id === badgeId);
      if (badge && badge.unlockedAt !== null) {
        throw new StorageError({
          code: 'DUPLICATE',
          key: BADGES_KEY,
          message: `Badge "${badgeId}" is already unlocked`,
        });
      }
      let newBadges: Badge[];
      if (badge) {
        newBadges = s.badges.map((b) =>
          b.id === badgeId ? { ...b, unlockedAt: nowISO, updatedAt: nowISO } : b,
        );
      } else {
        newBadges = [
          ...s.badges,
          {
            id: badgeId,
            title: badgeId === 'streak_7' ? '7일 스트릭' : badgeId,
            unlockedAt: nowISO,
            createdAt: nowISO,
            updatedAt: nowISO,
          },
        ];
      }
      setBadges(newBadges);
      refresh();
    },
    [refresh],
  );

  const value = useMemo<AppStoreContextValue>(
    () => ({
      ...state,
      resetAll,
      createHabit,
      updateHabit,
      deleteHabit,
      createCheckIn,
      upsertActiveGoal,
      unlockBadge,
    }),
    [state, resetAll, createHabit, updateHabit, deleteHabit, createCheckIn, upsertActiveGoal, unlockBadge],
  );

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppStore(): AppStoreContextValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}
