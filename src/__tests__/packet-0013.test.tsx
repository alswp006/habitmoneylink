import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import type { Badge } from "@/lib/types";
import BadgePage from "@/pages/Badge";

mockAll();

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeBadge(overrides: Partial<Badge> = {}): Badge {
  return {
    id: "streak_7", title: "7일 연속", unlockedAt: null,
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
    habitsById: new Map(), checkInsByHabitId: new Map(),
    checkInsByDate: new Map(), checkInUniqSet: new Set(),
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
    React.createElement(MemoryRouter, null, React.createElement(BadgePage)),
  );
}

beforeEach(() => {
  mockStore = makeStore();
  mockNavigate.mockClear();
});

// ─── AC-1: 배지 목록 렌더링 ─────────────────────────────────────────────────

describe("AC-1: 배지 목록 렌더링", () => {
  it("badges 길이만큼 ListRow가 렌더링된다", () => {
    mockStore = makeStore({
      badges: [
        makeBadge({ id: "streak_7", title: "7일 연속" }),
        makeBadge({ id: "streak_30", title: "30일 연속" }),
      ],
    });
    renderPage();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(2);
  });

  it("배지 title이 렌더링된다", () => {
    mockStore = makeStore({
      badges: [makeBadge({ id: "streak_7", title: "7일 연속" })],
    });
    renderPage();
    expect(screen.getByText("7일 연속")).toBeInTheDocument();
  });
});

// ─── AC-2: 잠김 상태 ─────────────────────────────────────────────────────────

describe("AC-2: streak_7 잠김 상태", () => {
  it("unlockedAt이 null이면 '잠김' 문구가 렌더링된다", () => {
    mockStore = makeStore({
      badges: [makeBadge({ id: "streak_7", unlockedAt: null })],
    });
    renderPage();
    expect(screen.getByText("잠김")).toBeInTheDocument();
  });

  it("잠김 상태이면 '배지 잠금 해제' ListRow가 렌더링된다", () => {
    mockStore = makeStore({
      badges: [makeBadge({ id: "streak_7", unlockedAt: null })],
    });
    renderPage();
    expect(screen.getByText("배지 잠금 해제")).toBeInTheDocument();
  });

  it("'배지 잠금 해제' 탭 시 /badge/unlock으로 navigate되고 badgeId가 state로 전달된다", () => {
    mockStore = makeStore({
      badges: [makeBadge({ id: "streak_7", unlockedAt: null })],
    });
    renderPage();
    fireEvent.click(screen.getByText("배지 잠금 해제").closest("[role='listitem']")!);
    expect(mockNavigate).toHaveBeenCalledWith("/badge/unlock", {
      state: { badgeId: "streak_7" },
    });
  });
});

// ─── AC-3: 획득 상태 ─────────────────────────────────────────────────────────

describe("AC-3: streak_7 획득 상태", () => {
  it("unlockedAt이 있으면 '획득함' 문구가 렌더링된다", () => {
    mockStore = makeStore({
      badges: [makeBadge({ id: "streak_7", unlockedAt: "2026-05-01T00:00:00.000Z" })],
    });
    renderPage();
    expect(screen.getByText("획득함")).toBeInTheDocument();
  });

  it("unlockedAt이 있으면 '배지 잠금 해제' ListRow가 렌더링되지 않는다", () => {
    mockStore = makeStore({
      badges: [makeBadge({ id: "streak_7", unlockedAt: "2026-05-01T00:00:00.000Z" })],
    });
    renderPage();
    expect(screen.queryByText("배지 잠금 해제")).toBeNull();
  });
});
