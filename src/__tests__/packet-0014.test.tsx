import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockAll, mockLocation } from "@/__tests__/__helpers__/mocks";
import { StorageError } from "@/lib/types";
import BadgeUnlockPage from "@/pages/BadgeUnlock";

mockAll();

// ─── helpers ─────────────────────────────────────────────────────────────────

const mockUnlockBadge = vi.fn();

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
    upsertActiveGoal: vi.fn(), unlockBadge: mockUnlockBadge,
    ...overrides,
  };
}

vi.mock("@/lib/store/AppStore", () => ({
  useAppStore: () => mockStore,
  AppStoreProvider: ({ children }: { children: React.ReactNode }) => children,
}));

function renderPage() {
  return render(
    React.createElement(MemoryRouter, null, React.createElement(BadgeUnlockPage)),
  );
}

beforeEach(() => {
  mockStore = makeStore();
  mockUnlockBadge.mockClear();
  (mockLocation as { state: unknown }).state = null;
});

// ─── AC-1: badgeId 없음 ───────────────────────────────────────────────────────

describe("AC-1: location.state에 badgeId 없음", () => {
  it("'배지를 선택해줘요' 문구가 렌더링된다", () => {
    renderPage();
    expect(screen.getByText("배지를 선택해줘요")).toBeInTheDocument();
  });

  it("잠금 해제 버튼이 렌더링되지 않는다", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: "잠금 해제하기" })).toBeNull();
  });
});

// ─── AC-2: 잠금 해제 호출 ────────────────────────────────────────────────────

describe("AC-2: 잠금 해제 버튼 탭", () => {
  it("잠금 해제 버튼 탭 시 unlockBadge가 1회 호출된다", () => {
    (mockLocation as { state: unknown }).state = { badgeId: "streak_7" };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "잠금 해제하기" }));
    expect(mockUnlockBadge).toHaveBeenCalledTimes(1);
  });

  it("unlockBadge 첫 번째 인수로 badgeId가 전달된다", () => {
    (mockLocation as { state: unknown }).state = { badgeId: "streak_7" };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "잠금 해제하기" }));
    expect(mockUnlockBadge).toHaveBeenCalledWith("streak_7", expect.any(String));
  });
});

// ─── AC-3: 중복 409 처리 ─────────────────────────────────────────────────────

describe("AC-3: DUPLICATE 에러 시 Toast", () => {
  it("unlockBadge가 DUPLICATE StorageError를 throw하면 Toast가 열린다", () => {
    (mockLocation as { state: unknown }).state = { badgeId: "streak_7" };
    mockUnlockBadge.mockImplementation(() => {
      throw new StorageError({ code: "DUPLICATE", key: "badges", message: "duplicate" });
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "잠금 해제하기" }));
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("Toast 텍스트에 '이미 획득한 배지예요'가 포함된다", () => {
    (mockLocation as { state: unknown }).state = { badgeId: "streak_7" };
    mockUnlockBadge.mockImplementation(() => {
      throw new StorageError({ code: "DUPLICATE", key: "badges", message: "duplicate" });
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "잠금 해제하기" }));
    expect(screen.getByText("이미 획득한 배지예요")).toBeInTheDocument();
  });
});
