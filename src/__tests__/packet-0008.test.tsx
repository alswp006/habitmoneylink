import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { type ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { StorageError } from "@/lib/types";
import type { Habit, CheckIn } from "@/lib/types";
import HomePage from "@/pages/Home";

function renderWithRouter(ui: ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => React.createElement(MemoryRouter, null, children),
  });
}

mockAll();

vi.mock("@/components/AdSlot", () => ({
  AdSlot: () => React.createElement("div", { "data-testid": "ad-slot" }),
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
    id: "c1", habitId: "h1", date: "2026-01-01", savedAmountKRW: 3000,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const mockResetAll = vi.fn();
const mockCreateCheckIn = vi.fn();

function makeDefaultStore(overrides: Record<string, unknown> = {}) {
  return {
    isHydrating: false,
    storageError: null,
    habits: [] as Habit[],
    checkIns: [] as CheckIn[],
    goals: [],
    badges: [],
    settings: null,
    habitsById: new Map<string, Habit>(),
    checkInsByHabitId: new Map<string, CheckIn[]>(),
    checkInsByDate: new Map<string, CheckIn[]>(),
    checkInUniqSet: new Set<string>(),
    activeGoal: null,
    resetAll: mockResetAll,
    createHabit: vi.fn(),
    updateHabit: vi.fn(),
    deleteHabit: vi.fn(),
    createCheckIn: mockCreateCheckIn,
    upsertActiveGoal: vi.fn(),
    unlockBadge: vi.fn(),
    ...overrides,
  };
}

let mockStore = makeDefaultStore();

vi.mock("@/lib/store/AppStore", () => ({
  useAppStore: () => mockStore,
  AppStoreProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  mockStore = makeDefaultStore();
  mockResetAll.mockClear();
  mockCreateCheckIn.mockClear();
  mockNavigate.mockClear();
});

// ─── AC-S1-1: 로딩 상태 ───────────────────────────────────────────────────────

describe("AC-S1-1: 로딩 상태", () => {
  it("isHydrating=true이면 '불러오는 중' 텍스트가 렌더링된다", () => {
    mockStore = makeDefaultStore({ isHydrating: true });
    renderWithRouter(<HomePage />);
    expect(screen.getByText("불러오는 중")).toBeInTheDocument();
  });
});

// ─── AC-S1-2: 활성 습관 목록 ──────────────────────────────────────────────────

describe("AC-S1-2: 활성 습관 목록", () => {
  it("활성 습관만 타이틀이 표시된다", () => {
    mockStore = makeDefaultStore({
      habits: [
        makeHabit({ id: "h1", title: "커피" }),
        makeHabit({ id: "h2", title: "배달", category: "delivery" }),
        makeHabit({ id: "h3", title: "담배", category: "smoking", isActive: false }),
      ],
    });
    renderWithRouter(<HomePage />);
    expect(screen.getByText("커피")).toBeInTheDocument();
    expect(screen.getByText("배달")).toBeInTheDocument();
    expect(screen.queryByText("담배")).toBeNull();
  });
});

// ─── AC-S1-3: 빈 상태 ────────────────────────────────────────────────────────

describe("AC-S1-3: 빈 상태 (활성 습관 0개)", () => {
  it("안내 문구와 '습관 추가' 버튼이 표시된다", () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText(/아직 습관이 없어요/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "습관 추가" })).toBeInTheDocument();
  });

  it("'습관 추가' 버튼 탭 시 '/habit/new'로 이동한다", () => {
    renderWithRouter(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "습관 추가" }));
    expect(mockNavigate).toHaveBeenCalledWith("/habit/new");
  });
});

// ─── AC-S1-4: 행 탭 → 이동 ───────────────────────────────────────────────────

describe("AC-S1-4: 습관 행 탭 → /habit/:id/edit 이동", () => {
  it("행 탭 시 '/habit/h1/edit'로 이동한다", () => {
    mockStore = makeDefaultStore({
      habits: [makeHabit({ id: "h1", title: "커피" })],
    });
    renderWithRouter(<HomePage />);
    const row = screen.getByText("커피").closest("[role='listitem']")!;
    fireEvent.click(row);
    expect(mockNavigate).toHaveBeenCalledWith("/habit/h1/edit");
  });
});

// ─── AC-S1-5: 누적 절약액 + AdSlot ──────────────────────────────────────────

describe("AC-S1-5: 누적 절약액 + AdSlot", () => {
  it("checkIns 합계가 포맷된 금액으로 표시된다", () => {
    mockStore = makeDefaultStore({
      checkIns: [
        makeCheckIn({ savedAmountKRW: 3000 }),
        makeCheckIn({ id: "c2", savedAmountKRW: 4500, date: "2026-01-02" }),
      ],
    });
    renderWithRouter(<HomePage />);
    expect(screen.getByText("7,500원")).toBeInTheDocument();
  });

  it("AdSlot이 정확히 1개 렌더링된다", () => {
    renderWithRouter(<HomePage />);
    expect(screen.getAllByTestId("ad-slot")).toHaveLength(1);
  });
});

// ─── AC-11/12: 스키마 오류 AlertDialog ───────────────────────────────────────

describe("AC-11/12: 스키마 오류 AlertDialog", () => {
  it("storageError.code === PARSE_ERROR이면 AlertDialog가 열린다", () => {
    mockStore = makeDefaultStore({
      storageError: new StorageError({ code: "PARSE_ERROR", key: "k", message: "m" }),
    });
    renderWithRouter(<HomePage />);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("storageError.code === SCHEMA_MISMATCH이면 AlertDialog가 열린다", () => {
    mockStore = makeDefaultStore({
      storageError: new StorageError({ code: "SCHEMA_MISMATCH", key: "k", message: "m" }),
    });
    renderWithRouter(<HomePage />);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("'초기화' 탭 시 resetAll이 1회 호출된다", () => {
    mockStore = makeDefaultStore({
      storageError: new StorageError({ code: "PARSE_ERROR", key: "k", message: "m" }),
    });
    renderWithRouter(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: "초기화" }));
    expect(mockResetAll).toHaveBeenCalledTimes(1);
  });
});
