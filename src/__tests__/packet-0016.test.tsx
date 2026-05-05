import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StorageError } from "@/lib/types";
import { getIsTossLoginIntegratedService } from "@apps-in-toss/web-framework";
import App from "@/App";

// ─── 인라인 mock (mocks.ts를 import하면 vi.mock 호이스팅 순서로 인해
//     TossRewardAd mock이 덮어써지므로, 이 파일에서 모든 mock을 직접 정의한다) ──

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/", search: "", state: null, key: "default" }),
  };
});

vi.mock("@apps-in-toss/web-framework", () => ({
  getIsTossLoginIntegratedService: vi.fn(async () => false),
  generateHapticFeedback: vi.fn(),
  loadFullScreenAd: vi.fn(),
  showFullScreenAd: vi.fn(),
}));

vi.mock("@toss/tds-mobile", () => ({
  // Tab.onChange receives the index — mock propagates it via onClick on each Item
  Tab: Object.assign(
    ({ children, onChange }: any) =>
      React.createElement(
        "nav",
        { role: "tablist" },
        React.Children.map(children, (child: any, index: number) =>
          React.cloneElement(child, { onClick: () => onChange?.(index) }),
        ),
      ),
    {
      Item: ({ children, selected, onClick }: any) =>
        React.createElement("button", { role: "tab", "aria-selected": selected, onClick }, children),
    },
  ),
  Toast: ({ open, text, position }: any) =>
    open ? React.createElement("div", { role: "status", "data-position": position }, text) : null,
}));

// 슬롯 ID를 data-testid로 노출해 래핑 여부를 검증
vi.mock("@/components/TossRewardAd", () => ({
  TossRewardAd: ({ children, slotId }: any) =>
    React.createElement("div", { "data-testid": `reward-gate-${slotId}` }, children),
}));

vi.mock("@/pages/Home", () => ({ default: () => React.createElement("div", { "data-testid": "page-home" }) }));
vi.mock("@/pages/HabitNew", () => ({ default: () => React.createElement("div", { "data-testid": "page-habit-new" }) }));
vi.mock("@/pages/HabitEdit", () => ({ default: () => React.createElement("div", { "data-testid": "page-habit-edit" }) }));
vi.mock("@/pages/Goal", () => ({ default: () => React.createElement("div", { "data-testid": "page-goal" }) }));
vi.mock("@/pages/Report", () => ({ default: () => React.createElement("div", { "data-testid": "page-report" }) }));
vi.mock("@/pages/Badge", () => ({ default: () => React.createElement("div", { "data-testid": "page-badge" }) }));
vi.mock("@/pages/BadgeUnlock", () => ({ default: () => React.createElement("div", { "data-testid": "page-badge-unlock" }) }));
vi.mock("@/pages/Blocking", () => ({ default: () => React.createElement("div", { "data-testid": "page-blocking" }) }));

let mockStore: Record<string, unknown> = {};

function makeStore(overrides: Record<string, unknown> = {}) {
  return {
    isHydrating: false, storageError: null,
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
  AppStoreProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

function renderApp(path = "/") {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)),
  );
}

beforeEach(() => {
  mockStore = makeStore();
  mockNavigate.mockClear();
  vi.mocked(getIsTossLoginIntegratedService).mockResolvedValue(false);
});

// ─── AC-1: TabBar 렌더링 및 탭 네비게이션 ────────────────────────────────────

describe("AC-1: TabBar 렌더링 및 탭 네비게이션", () => {
  it("TabBar에 홈/리포트/배지 탭이 렌더링된다", async () => {
    renderApp("/");
    await waitFor(() => expect(screen.getByRole("tablist")).toBeInTheDocument());
    expect(screen.getByRole("tab", { name: "홈" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "리포트" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "배지" })).toBeInTheDocument();
  });

  it("홈 탭 탭 시 '/'로 navigate된다", async () => {
    renderApp("/");
    await waitFor(() => expect(screen.getByRole("tab", { name: "홈" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("tab", { name: "홈" }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("리포트 탭 탭 시 '/report'로 navigate된다", async () => {
    renderApp("/");
    await waitFor(() => expect(screen.getByRole("tab", { name: "리포트" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("tab", { name: "리포트" }));
    expect(mockNavigate).toHaveBeenCalledWith("/report");
  });

  it("배지 탭 탭 시 '/badge'로 navigate된다", async () => {
    renderApp("/");
    await waitFor(() => expect(screen.getByRole("tab", { name: "배지" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("tab", { name: "배지" }));
    expect(mockNavigate).toHaveBeenCalledWith("/badge");
  });
});

// ─── AC-2: TossRewardAd 보상형 게이트 ────────────────────────────────────────

describe("AC-2: TossRewardAd 보상형 게이트", () => {
  it("'/report' 라우트는 TossRewardAd(slotId=report-unlock)로 감싸진다", async () => {
    renderApp("/report");
    await waitFor(() =>
      expect(screen.getByTestId("reward-gate-report-unlock")).toBeInTheDocument(),
    );
  });

  it("'/badge/unlock' 라우트는 TossRewardAd(slotId=badge-unlock)로 감싸진다", async () => {
    renderApp("/badge/unlock");
    await waitFor(() =>
      expect(screen.getByTestId("reward-gate-badge-unlock")).toBeInTheDocument(),
    );
  });

  it("'/goal' 라우트는 TossRewardAd로 감싸지지 않는다", async () => {
    renderApp("/goal");
    await waitFor(() => expect(screen.getByTestId("page-goal")).toBeInTheDocument());
    expect(screen.queryByTestId(/^reward-gate-/)).toBeNull();
  });
});

// ─── AC-3: QUOTA_EXCEEDED 전역 Toast ─────────────────────────────────────────

describe("AC-3: QUOTA_EXCEEDED 전역 Toast", () => {
  it("storageError.code==='QUOTA_EXCEEDED'이면 Toast가 열린다", async () => {
    mockStore = makeStore({
      storageError: new StorageError({ code: "QUOTA_EXCEEDED", key: "habits", message: "quota" }),
    });
    renderApp("/");
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
  });

  it("Toast 텍스트에 '저장공간이 부족해요'가 포함된다", async () => {
    mockStore = makeStore({
      storageError: new StorageError({ code: "QUOTA_EXCEEDED", key: "habits", message: "quota" }),
    });
    renderApp("/");
    await waitFor(() => expect(screen.getByText(/저장공간이 부족해요/)).toBeInTheDocument());
  });

  it("storageError가 없으면 Toast가 열리지 않는다", async () => {
    renderApp("/");
    await waitFor(() => expect(screen.getByTestId("page-home")).toBeInTheDocument());
    expect(screen.queryByRole("status")).toBeNull();
  });
});

// ─── AC-4: safe-area-inset-bottom ────────────────────────────────────────────

describe("AC-4: TabBar safe-area padding", () => {
  it("TabBar wrapper에 env(safe-area-inset-bottom)이 포함된 paddingBottom이 있다", async () => {
    renderApp("/");
    await waitFor(() => expect(screen.getByRole("tablist")).toBeInTheDocument());
    const wrapper = screen.getByRole("tablist").parentElement;
    expect(wrapper?.outerHTML).toContain("safe-area-inset-bottom");
  });
});
