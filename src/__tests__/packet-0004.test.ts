import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { AppStoreProvider, useAppStore } from "@/lib/store/AppStore";
import { getTodayKstYmd } from "@/lib/date/kst";
import { HABITS_KEY, CHECKINS_KEY, GOALS_KEY, BADGES_KEY, SETTINGS_KEY } from "@/lib/storage/keys";
import { StorageError } from "@/lib/types";
import type { Habit, CheckIn, Badge } from "@/lib/types";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AppStoreProvider, null, children);

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

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
function makeBadge(overrides: Partial<Badge> = {}): Badge {
  return {
    id: "streak_7", title: "7일 스트릭", unlockedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// ─── getTodayKstYmd ───────────────────────────────────────────────────────────

describe("getTodayKstYmd", () => {
  it("YYYY-MM-DD 포맷을 반환한다", () => {
    expect(getTodayKstYmd()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ─── 하이드레이션 기본 ─────────────────────────────────────────────────────────

describe("AppStore 하이드레이션", () => {
  it("하이드레이션 완료 후 isHydrating=false", async () => {
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => expect(result.current.isHydrating).toBe(false));
  });

  it("빈 localStorage → 빈 배열, activeGoal=null", async () => {
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);
    expect(result.current.habits).toEqual([]);
    expect(result.current.checkIns).toEqual([]);
    expect(result.current.activeGoal).toBeNull();
  });

  it("데이터 있으면 habitsById Map이 구성된다", async () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify([makeHabit()]));
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);
    expect(result.current.habitsById.get("h1")).toBeDefined();
  });

  it("checkIn이 있으면 checkInUniqSet에 key가 들어간다", async () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify([makeHabit()]));
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([makeCheckIn()]));
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);
    expect(result.current.checkInUniqSet.has("h1::2026-01-01")).toBe(true);
  });
});

// ─── FK 검증 → storageError ───────────────────────────────────────────────────

describe("AC-3: FK 무결성 실패 → storageError SCHEMA_MISMATCH", () => {
  it("checkIn.habitId가 없는 habit을 참조하면 SCHEMA_MISMATCH", async () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify([]));
    localStorage.setItem(
      CHECKINS_KEY,
      JSON.stringify([makeCheckIn({ habitId: "h_missing" })]),
    );
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);
    expect(result.current.storageError?.code).toBe("SCHEMA_MISMATCH");
  });

  it("FK 실패 시에도 앱이 크래시하지 않는다(빈 배열 유지)", async () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify([]));
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([makeCheckIn({ habitId: "h_ghost" })]));
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);
    expect(result.current.habits).toEqual([]);
  });
});

// ─── resetAll ────────────────────────────────────────────────────────────────

describe("AC-4: resetAll", () => {
  it("5개 키가 localStorage에서 사라진다", async () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify([makeHabit()]));
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);

    act(() => { result.current.resetAll(); });
    await waitFor(() => result.current.habits.length === 0);

    expect(localStorage.getItem(HABITS_KEY)).toBeNull();
    expect(localStorage.getItem(CHECKINS_KEY)).toBeNull();
    expect(localStorage.getItem(GOALS_KEY)).toBeNull();
    expect(localStorage.getItem(BADGES_KEY)).toBeNull();
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull();
  });
});

// ─── createHabit ─────────────────────────────────────────────────────────────

describe("createHabit", () => {
  it("habits가 1개 추가된다", async () => {
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);

    act(() => {
      result.current.createHabit({ category: "coffee", title: "커피", unitPriceKRW: 3000 });
    });
    await waitFor(() => result.current.habits.length === 1);
    expect(result.current.habits[0].category).toBe("coffee");
  });

  it("createdAt === updatedAt", async () => {
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);
    act(() => {
      result.current.createHabit({ category: "coffee", title: "커피", unitPriceKRW: 3000 });
    });
    await waitFor(() => result.current.habits.length === 1);
    const h = result.current.habits[0];
    expect(h.createdAt).toBe(h.updatedAt);
  });
});

// ─── updateHabit ─────────────────────────────────────────────────────────────

describe("updateHabit", () => {
  it("updatedAt만 갱신된다(createdAt 불변)", async () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify([makeHabit()]));
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);
    const before = result.current.habits[0];

    act(() => {
      result.current.updateHabit("h1", { title: "커피2" });
    });
    await waitFor(() => result.current.habits[0].title === "커피2");
    expect(result.current.habits[0].createdAt).toBe(before.createdAt);
  });
});

// ─── deleteHabit ─────────────────────────────────────────────────────────────

describe("deleteHabit", () => {
  it("해당 habit과 checkIn이 함께 삭제된다(cascade)", async () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify([makeHabit()]));
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([makeCheckIn()]));
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);

    act(() => { result.current.deleteHabit("h1"); });
    await waitFor(() => result.current.habits.length === 0);
    expect(result.current.checkIns).toHaveLength(0);
  });
});

// ─── createCheckIn ───────────────────────────────────────────────────────────

describe("AC-5: createCheckIn", () => {
  it("habit 없으면 INVALID_REF", async () => {
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);

    expect(() =>
      result.current.createCheckIn({ habitId: "h_none", date: "2026-01-01", savedAmountKRW: 1000 }),
    ).toThrow(StorageError);
    try {
      result.current.createCheckIn({ habitId: "h_none", date: "2026-01-01", savedAmountKRW: 1000 });
    } catch (e) {
      expect((e as StorageError).code).toBe("INVALID_REF");
    }
  });

  it("비활성 habit이면 INVALID_REF", async () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify([makeHabit({ isActive: false })]));
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);

    expect(() =>
      result.current.createCheckIn({ habitId: "h1", date: "2026-01-01", savedAmountKRW: 1000 }),
    ).toThrow(StorageError);
    try {
      result.current.createCheckIn({ habitId: "h1", date: "2026-01-01", savedAmountKRW: 1000 });
    } catch (e) {
      expect((e as StorageError).code).toBe("INVALID_REF");
    }
  });

  it("(habitId, date) 중복이면 DUPLICATE", async () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify([makeHabit()]));
    localStorage.setItem(CHECKINS_KEY, JSON.stringify([makeCheckIn()]));
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);

    expect(() =>
      result.current.createCheckIn({ habitId: "h1", date: "2026-01-01", savedAmountKRW: 1000 }),
    ).toThrow(StorageError);
    try {
      result.current.createCheckIn({ habitId: "h1", date: "2026-01-01", savedAmountKRW: 1000 });
    } catch (e) {
      expect((e as StorageError).code).toBe("DUPLICATE");
    }
  });

  it("정상 체크인 시 checkIns가 1개 추가된다", async () => {
    localStorage.setItem(HABITS_KEY, JSON.stringify([makeHabit()]));
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);

    act(() => {
      result.current.createCheckIn({ habitId: "h1", date: "2026-05-01", savedAmountKRW: 3000 });
    });
    await waitFor(() => result.current.checkIns.length === 1);
    expect(result.current.checkIns[0].savedAmountKRW).toBe(3000);
  });
});

// ─── upsertActiveGoal ─────────────────────────────────────────────────────────

describe("upsertActiveGoal", () => {
  it("activeGoal이 없으면 새로 생성된다", async () => {
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);

    act(() => {
      result.current.upsertActiveGoal({ title: "아이폰", targetAmountKRW: 1500000 });
    });
    await waitFor(() => result.current.activeGoal !== null);
    expect(result.current.activeGoal?.title).toBe("아이폰");
  });

  it("activeGoal이 있으면 업데이트된다", async () => {
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);

    act(() => {
      result.current.upsertActiveGoal({ title: "아이폰", targetAmountKRW: 1500000 });
    });
    await waitFor(() => result.current.activeGoal !== null);

    act(() => {
      result.current.upsertActiveGoal({ title: "맥북", targetAmountKRW: 2000000 });
    });
    await waitFor(() => result.current.activeGoal?.title === "맥북");
    expect(result.current.goals).toHaveLength(1);
  });
});

// ─── unlockBadge ──────────────────────────────────────────────────────────────

describe("AC-F6-6: unlockBadge", () => {
  it("이미 unlockedAt이 있으면 DUPLICATE", async () => {
    localStorage.setItem(
      BADGES_KEY,
      JSON.stringify([makeBadge({ unlockedAt: "2026-05-03T00:00:00.000Z" })]),
    );
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);

    expect(() =>
      result.current.unlockBadge("streak_7", "2026-05-05T00:00:00.000Z"),
    ).toThrow(StorageError);
    try {
      result.current.unlockBadge("streak_7", "2026-05-05T00:00:00.000Z");
    } catch (e) {
      expect((e as StorageError).code).toBe("DUPLICATE");
    }
  });

  it("언락 성공 시 unlockedAt이 설정된다", async () => {
    localStorage.setItem(BADGES_KEY, JSON.stringify([makeBadge()]));
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => !result.current.isHydrating);
    const nowISO = "2026-05-05T00:00:00.000Z";

    act(() => { result.current.unlockBadge("streak_7", nowISO); });
    await waitFor(() => result.current.badges[0].unlockedAt !== null);
    expect(result.current.badges[0].unlockedAt).toBe(nowISO);
  });
});
