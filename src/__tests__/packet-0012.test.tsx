import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockAll } from "@/__tests__/__helpers__/mocks";
import type { Habit, CheckIn } from "@/lib/types";
import ReportPage from "@/pages/Report";

mockAll();

// 날짜를 고정해 week 계산을 안정적으로 만든다 (2026-05-05 = 수요일)
vi.mock("@/lib/date/kst", () => ({
  getTodayKstYmd: () => "2026-05-05",
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1", category: "coffee", title: "커피", unitPriceKRW: 3000,
    isActive: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    id: "c1", habitId: "h1", date: "2026-05-05", savedAmountKRW: 3000,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

let mockStore: Record<string, unknown> = {};

function makeStore(overrides: Record<string, unknown> = {}) {
  return {
    isHydrating: false,
    storageError: null,
    habits: [], checkIns: [], goals: [], badges: [], settings: null,
    habitsById: new Map<string, Habit>(),
    checkInsByHabitId: new Map(), checkInsByDate: new Map(), checkInUniqSet: new Set(),
    activeGoal: null,
    resetAll: vi.fn(), createHabit: vi.fn(), updateHabit: vi.fn(),
    deleteHabit: vi.fn(), createCheckIn: vi.fn(),
    upsertActiveGoal: vi.fn(), unlockBadge: vi.fn(),
    ...overrides,
  };
}

vi.mock("@/lib/store/AppStore", () => ({
  useAppStore: () => mockStore,
  AppStoreProvider: ({ children }: { children: React.ReactNode }) => children,
}));

function renderPage() {
  return render(
    React.createElement(MemoryRouter, null, React.createElement(ReportPage)),
  );
}

beforeEach(() => {
  mockStore = makeStore();
});

// ─── AC-1: 로딩 ───────────────────────────────────────────────────────────────

describe("AC-1: 로딩 상태", () => {
  it("isHydrating=true이면 '불러오는 중' 텍스트만 렌더링된다", () => {
    mockStore = makeStore({ isHydrating: true });
    renderPage();
    expect(screen.getByText("불러오는 중")).toBeInTheDocument();
    expect(screen.queryByText("이번 주 절약")).toBeNull();
  });
});

// ─── AC-2: 이번 주 절약 섹션 ─────────────────────────────────────────────────

describe("AC-2: 이번 주 절약 섹션", () => {
  it("'이번 주 절약' 섹션 타이틀이 렌더링된다", () => {
    renderPage();
    expect(screen.getByText("이번 주 절약")).toBeInTheDocument();
  });

  it("체크인이 0개여도 '0원'이 렌더링된다", () => {
    renderPage();
    expect(screen.getByText("0원")).toBeInTheDocument();
  });

  it("이번 주 체크인 합계 금액이 렌더링된다", () => {
    const h1 = makeHabit();
    mockStore = makeStore({
      checkIns: [
        makeCheckIn({ savedAmountKRW: 3000, date: "2026-05-05" }),
        makeCheckIn({ id: "c2", savedAmountKRW: 4500, date: "2026-05-04" }),
      ],
      habitsById: new Map([["h1", h1]]),
    });
    renderPage();
    // 7500원 = 3000 + 4500
    expect(screen.getAllByText("7,500원").length).toBeGreaterThanOrEqual(1);
  });
});

// ─── AC-3: 빈 상태 ───────────────────────────────────────────────────────────

describe("AC-3: 빈 상태 (이번 주 체크인 없음)", () => {
  it("체크인 0개이면 '이번 주에는 아직 체크인이 없어요'가 렌더링된다", () => {
    renderPage();
    expect(screen.getByText("이번 주에는 아직 체크인이 없어요")).toBeInTheDocument();
  });

  it("체크인이 있으면 빈 상태 문구가 렌더링되지 않는다", () => {
    const h1 = makeHabit();
    mockStore = makeStore({
      checkIns: [makeCheckIn({ date: "2026-05-05" })],
      habitsById: new Map([["h1", h1]]),
    });
    renderPage();
    expect(screen.queryByText("이번 주에는 아직 체크인이 없어요")).toBeNull();
  });

  it("체크인이 있으면 습관명이 표시된다", () => {
    const h1 = makeHabit({ title: "커피" });
    mockStore = makeStore({
      checkIns: [makeCheckIn({ date: "2026-05-05" })],
      habitsById: new Map([["h1", h1]]),
    });
    renderPage();
    expect(screen.getByText("커피")).toBeInTheDocument();
  });
});
