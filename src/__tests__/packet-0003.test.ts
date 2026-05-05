import { describe, it, expect, vi } from "vitest";
import { StorageError } from "@/lib/types";
import { HABITS_KEY, CHECKINS_KEY, GOALS_KEY, BADGES_KEY, SETTINGS_KEY } from "@/lib/storage/keys";
import {
  getHabits, setHabits,
  getCheckIns, setCheckIns,
  getGoals, setGoals,
  getBadges, setBadges,
  getSettings, setSettings,
} from "@/lib/storage/entities";
import type { Habit, CheckIn, Goal, Badge, AppSettings } from "@/lib/types";

// ─── 공통 헬퍼 ───────────────────────────────────────────────────────────────

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1", category: "coffee", title: "커피", unitPriceKRW: 3000,
    isActive: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: "c1", habitId: "h1", date: "2026-01-01", savedAmountKRW: 3000,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "g1", title: "아이폰", targetAmountKRW: 1500000,
    isActive: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeBadge(overrides: Partial<Badge> = {}): Badge {
  return {
    id: "streak_7", title: "7일 스트릭", unlockedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    id: "s1", weekStartsOn: "mon", lastOpenedDate: "2026-01-01",
    promotionRewardGranted: false, aiDisclosureAccepted: true,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// ─── 키 미존재 시 기본값 반환 ─────────────────────────────────────────────────

describe("AC-1: 키 미존재 시 기본값", () => {
  it("getHabits — 빈 배열 반환", () => {
    expect(getHabits()).toEqual([]);
  });
  it("getCheckIns — 빈 배열 반환", () => {
    expect(getCheckIns()).toEqual([]);
  });
  it("getGoals — 빈 배열 반환", () => {
    expect(getGoals()).toEqual([]);
  });
  it("getBadges — 빈 배열 반환", () => {
    expect(getBadges()).toEqual([]);
  });
  it("getSettings — null 반환", () => {
    expect(getSettings()).toBeNull();
  });
});

// ─── 정상 저장 + 조회 ─────────────────────────────────────────────────────────

describe("AC-1: 정상 set → get 라운드트립", () => {
  it("setHabits/getHabits 라운드트립", () => {
    const habits = [makeHabit()];
    setHabits(habits);
    expect(getHabits()).toEqual(habits);
  });
  it("setCheckIns/getCheckIns 라운드트립", () => {
    const checkIns = [makeCheckIn()];
    setCheckIns(checkIns);
    expect(getCheckIns()).toEqual(checkIns);
  });
  it("setGoals/getGoals 라운드트립", () => {
    const goals = [makeGoal({ isActive: true }), makeGoal({ id: "g2", isActive: false })];
    setGoals(goals);
    expect(getGoals()).toEqual(goals);
  });
  it("setBadges/getBadges 라운드트립", () => {
    const badges = [makeBadge()];
    setBadges(badges);
    expect(getBadges()).toEqual(badges);
  });
  it("setSettings/getSettings 라운드트립", () => {
    const settings = makeSettings();
    setSettings(settings);
    expect(getSettings()).toEqual(settings);
  });
});

// ─── SCHEMA_MISMATCH: id가 string이 아닌 경우 ────────────────────────────────

describe("AC-2: 최소 스키마 검증 — id 타입 위반 시 SCHEMA_MISMATCH", () => {
  it("getHabits — id가 number면 SCHEMA_MISMATCH", () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify([{ id: 1, category: "coffee" }]));
    expect(() => getHabits()).toThrow(StorageError);
    try { getHabits(); } catch (e) {
      expect((e as StorageError).code).toBe("SCHEMA_MISMATCH");
      expect((e as StorageError).key).toBe(HABITS_KEY);
    }
  });
  it("getCheckIns — id가 없으면 SCHEMA_MISMATCH", () => {
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([{ habitId: "h1", date: "2026-01-01" }]));
    expect(() => getCheckIns()).toThrow(StorageError);
    try { getCheckIns(); } catch (e) {
      expect((e as StorageError).code).toBe("SCHEMA_MISMATCH");
    }
  });
  it("getGoals — id가 없으면 SCHEMA_MISMATCH", () => {
    localStorage.setItem(GOALS_KEY, JSON.stringify([{ title: "목표" }]));
    expect(() => getGoals()).toThrow(StorageError);
    try { getGoals(); } catch (e) {
      expect((e as StorageError).code).toBe("SCHEMA_MISMATCH");
    }
  });
  it("getBadges — id가 없으면 SCHEMA_MISMATCH", () => {
    localStorage.setItem(BADGES_KEY, JSON.stringify([{ title: "배지" }]));
    expect(() => getBadges()).toThrow(StorageError);
    try { getBadges(); } catch (e) {
      expect((e as StorageError).code).toBe("SCHEMA_MISMATCH");
    }
  });
  it("getSettings — id가 없으면 SCHEMA_MISMATCH", () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ weekStartsOn: "mon" }));
    expect(() => getSettings()).toThrow(StorageError);
    try { getSettings(); } catch (e) {
      expect((e as StorageError).code).toBe("SCHEMA_MISMATCH");
    }
  });
});

// ─── SCHEMA_MISMATCH: 배열이 아닌 경우 ──────────────────────────────────────

describe("AC-2: 배열이어야 할 키에 객체가 저장된 경우 SCHEMA_MISMATCH", () => {
  it("getHabits — 객체면 SCHEMA_MISMATCH", () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify({ id: "h1" }));
    expect(() => getHabits()).toThrow(StorageError);
    try { getHabits(); } catch (e) {
      expect((e as StorageError).code).toBe("SCHEMA_MISMATCH");
    }
  });
});

// ─── SCHEMA_MISMATCH: 활성 Goal 2개 이상 ────────────────────────────────────

describe("AC-3: getGoals — isActive=true가 2개 이상이면 SCHEMA_MISMATCH", () => {
  it("활성 Goal 2개면 SCHEMA_MISMATCH", () => {
    const twoActive = [
      makeGoal({ id: "g1", isActive: true }),
      makeGoal({ id: "g2", isActive: true }),
    ];
    localStorage.setItem(GOALS_KEY, JSON.stringify(twoActive));
    expect(() => getGoals()).toThrow(StorageError);
    try { getGoals(); } catch (e) {
      expect((e as StorageError).code).toBe("SCHEMA_MISMATCH");
      expect((e as StorageError).key).toBe(GOALS_KEY);
    }
  });
  it("활성 Goal 1개면 정상 반환", () => {
    const oneActive = [makeGoal({ id: "g1", isActive: true }), makeGoal({ id: "g2", isActive: false })];
    localStorage.setItem(GOALS_KEY, JSON.stringify(oneActive));
    expect(() => getGoals()).not.toThrow();
  });
});

// ─── set* → safeSetItem 경유 확인 (QUOTA_EXCEEDED 전파) ─────────────────────

describe("AC-4: set* — QUOTA_EXCEEDED 전파", () => {
  it("setHabits에서 QUOTA_EXCEEDED가 상위로 throw된다", () => {
    const spy = vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    expect(() => setHabits([makeHabit()])).toThrow(StorageError);
    try { setHabits([makeHabit()]); } catch (e) { /* already restored */ }
    spy.mockRestore();
  });
});
