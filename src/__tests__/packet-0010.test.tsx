import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { StorageError } from "@/lib/types";
import type { Habit } from "@/lib/types";
import HabitEditPage from "@/pages/HabitEdit";

mockAll();

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1", category: "coffee", title: "커피", unitPriceKRW: 3000,
    isActive: true, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const mockUpdateHabit = vi.fn();
const mockDeleteHabit = vi.fn();

let mockStore: Record<string, unknown> = {};

function makeStore(overrides: Record<string, unknown> = {}) {
  const h1 = makeHabit();
  return {
    isHydrating: false,
    storageError: null as StorageError | null,
    habits: [h1],
    checkIns: [],
    goals: [],
    badges: [],
    settings: null,
    habitsById: new Map<string, Habit>([["h1", h1]]),
    checkInsByHabitId: new Map(),
    checkInsByDate: new Map(),
    checkInUniqSet: new Set<string>(),
    activeGoal: null,
    resetAll: vi.fn(),
    createHabit: vi.fn(),
    updateHabit: mockUpdateHabit,
    deleteHabit: mockDeleteHabit,
    createCheckIn: vi.fn(),
    upsertActiveGoal: vi.fn(),
    unlockBadge: vi.fn(),
    ...overrides,
  };
}

vi.mock("@/lib/store/AppStore", () => ({
  useAppStore: () => mockStore,
  AppStoreProvider: ({ children }: { children: React.ReactNode }) => children,
}));

function renderPage(habitId: string) {
  return render(
    <MemoryRouter initialEntries={[`/habit/${habitId}/edit`]}>
      <Routes>
        <Route path="/habit/:habitId/edit" element={<HabitEditPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockStore = makeStore();
  mockUpdateHabit.mockClear();
  mockDeleteHabit.mockClear();
  mockNavigate.mockClear();
});

// ─── AC-1: 없는 habitId ───────────────────────────────────────────────────────

describe("AC-1: habitId 없음(404)", () => {
  it("'습관을 찾을 수 없어요' 문구가 렌더링된다", () => {
    mockStore = makeStore({ habitsById: new Map(), habits: [] });
    renderPage("nonexistent");
    expect(screen.getByText("습관을 찾을 수 없어요")).toBeInTheDocument();
  });

  it("저장 버튼이 렌더링되지 않는다", () => {
    mockStore = makeStore({ habitsById: new Map(), habits: [] });
    renderPage("nonexistent");
    expect(screen.queryByRole("button", { name: "저장" })).toBeNull();
  });

  it("삭제 버튼이 렌더링되지 않는다", () => {
    mockStore = makeStore({ habitsById: new Map(), habits: [] });
    renderPage("nonexistent");
    expect(screen.queryByRole("button", { name: "삭제" })).toBeNull();
  });
});

// ─── AC-2: Switch 토글 ────────────────────────────────────────────────────────

describe("AC-2: Switch 토글", () => {
  it("Switch 토글 시 updateHabit이 1회 호출된다", () => {
    renderPage("h1");
    fireEvent.click(screen.getByRole("switch"));
    expect(mockUpdateHabit).toHaveBeenCalledTimes(1);
    expect(mockUpdateHabit).toHaveBeenCalledWith("h1", { isActive: false });
  });

  it("토글 후 Switch checked 상태가 즉시 반전된다", () => {
    renderPage("h1");
    const sw = screen.getByRole("switch") as HTMLInputElement;
    expect(sw.checked).toBe(true);
    fireEvent.click(sw);
    expect(sw.checked).toBe(false);
  });
});

// ─── AC-3: 삭제 AlertDialog ───────────────────────────────────────────────────

describe("AC-3: 삭제 확인 AlertDialog", () => {
  it("삭제 버튼 탭 시 AlertDialog가 열린다", () => {
    renderPage("h1");
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("AlertDialog '삭제' 탭 시 deleteHabit이 1회 호출된다", () => {
    renderPage("h1");
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "삭제" }),
    );
    expect(mockDeleteHabit).toHaveBeenCalledTimes(1);
    expect(mockDeleteHabit).toHaveBeenCalledWith("h1");
  });

  it("AlertDialog '삭제' 탭 시 navigate('/')가 호출된다", () => {
    renderPage("h1");
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "삭제" }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
