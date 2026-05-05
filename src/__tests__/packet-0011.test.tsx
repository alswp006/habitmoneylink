import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import type { Goal } from "@/lib/types";
import GoalPage from "@/pages/Goal";

mockAll();

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "g1", title: "아이폰", targetAmountKRW: 1_500_000, isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const mockUpsertActiveGoal = vi.fn();

let mockStore: Record<string, unknown> = {};

function makeStore(overrides: Record<string, unknown> = {}) {
  return {
    isHydrating: false,
    storageError: null,
    habits: [], checkIns: [], goals: [], badges: [], settings: null,
    habitsById: new Map(), checkInsByHabitId: new Map(),
    checkInsByDate: new Map(), checkInUniqSet: new Set(),
    activeGoal: null,
    resetAll: vi.fn(), createHabit: vi.fn(), updateHabit: vi.fn(),
    deleteHabit: vi.fn(), createCheckIn: vi.fn(),
    upsertActiveGoal: mockUpsertActiveGoal,
    unlockBadge: vi.fn(),
    ...overrides,
  };
}

vi.mock("@/lib/store/AppStore", () => ({
  useAppStore: () => mockStore,
  AppStoreProvider: ({ children }: { children: React.ReactNode }) => children,
}));

function renderPage() {
  return render(
    React.createElement(MemoryRouter, null, React.createElement(GoalPage)),
  );
}

beforeEach(() => {
  mockStore = makeStore();
  mockUpsertActiveGoal.mockClear();
  mockNavigate.mockClear();
});

// ─── AC-1: activeGoal 사전 채움 ───────────────────────────────────────────────

describe("AC-1: activeGoal 사전 채움", () => {
  it("activeGoal이 있으면 title 필드가 초기화된다", () => {
    mockStore = makeStore({ activeGoal: makeGoal({ title: "아이폰" }) });
    renderPage();
    const titleInput = screen.getAllByRole("textbox")[0] as HTMLInputElement;
    expect(titleInput.value).toBe("아이폰");
  });

  it("activeGoal이 있으면 targetAmountKRW 필드가 초기화된다", () => {
    mockStore = makeStore({ activeGoal: makeGoal({ targetAmountKRW: 1_500_000 }) });
    renderPage();
    const amountInput = screen.getAllByRole("textbox")[1] as HTMLInputElement;
    expect(amountInput.value).toBe("1500000");
  });

  it("activeGoal이 없으면 빈 값으로 시작한다", () => {
    renderPage();
    const [titleInput, amountInput] = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(titleInput.value).toBe("");
    expect(amountInput.value).toBe("");
  });
});

// ─── AC-2: 유효성 검증 ────────────────────────────────────────────────────────

describe("AC-2: 금액 유효성 검증", () => {
  it("숫자가 아닌 값이면 upsertActiveGoal이 호출되지 않는다", () => {
    renderPage();
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(mockUpsertActiveGoal).not.toHaveBeenCalled();
  });

  it("숫자가 아닌 값이면 TextField error가 렌더링된다", () => {
    renderPage();
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("범위 미만(999)이면 upsertActiveGoal이 호출되지 않는다", () => {
    renderPage();
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "999" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(mockUpsertActiveGoal).not.toHaveBeenCalled();
  });

  it("범위 초과(100,000,001)이면 upsertActiveGoal이 호출되지 않는다", () => {
    renderPage();
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "100000001" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(mockUpsertActiveGoal).not.toHaveBeenCalled();
  });
});

// ─── AC-3: 유효 저장 ──────────────────────────────────────────────────────────

describe("AC-3: 유효 저장", () => {
  it("유효한 값 저장 시 upsertActiveGoal이 1회 호출된다", () => {
    renderPage();
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "맥북" } });
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "2000000" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(mockUpsertActiveGoal).toHaveBeenCalledTimes(1);
    expect(mockUpsertActiveGoal).toHaveBeenCalledWith({
      title: "맥북",
      targetAmountKRW: 2_000_000,
    });
  });

  it("유효한 값 저장 성공 시 Toast가 열린다", () => {
    renderPage();
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
