import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockAll } from "@/__tests__/__helpers__/mocks";
import App from "@/App";

mockAll();

// ─── 페이지 스텁 ──────────────────────────────────────────────────────────────

vi.mock("@/pages/Home", () => ({ default: () => React.createElement("div", { "data-testid": "page-home" }) }));
vi.mock("@/pages/HabitNew", () => ({ default: () => React.createElement("div", { "data-testid": "page-habit-new" }) }));
vi.mock("@/pages/HabitEdit", () => ({ default: () => React.createElement("div", { "data-testid": "page-habit-edit" }) }));
vi.mock("@/pages/Goal", () => ({ default: () => React.createElement("div", { "data-testid": "page-goal" }) }));
vi.mock("@/pages/Report", () => ({ default: () => React.createElement("div", { "data-testid": "page-report" }) }));
vi.mock("@/pages/Badge", () => ({ default: () => React.createElement("div", { "data-testid": "page-badge" }) }));
vi.mock("@/pages/BadgeUnlock", () => ({ default: () => React.createElement("div", { "data-testid": "page-badge-unlock" }) }));
vi.mock("@/pages/Blocking", () => ({ default: () => React.createElement("div", { "data-testid": "page-blocking" }) }));

vi.mock("@/lib/store/AppStore", () => ({
  useAppStore: () => ({ storageError: null }),
  AppStoreProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

function renderApp(path = "/") {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── AC-1 + AC-2: 미커버 라우트 완결 ─────────────────────────────────────────

describe("AC-1 + AC-2: 모든 Route 연결", () => {
  it("'/habit/new' 경로에서 HabitNew가 렌더링된다", async () => {
    renderApp("/habit/new");
    await waitFor(() => expect(screen.getByTestId("page-habit-new")).toBeInTheDocument());
  });

  it("'/habit/:habitId/edit' 경로에서 HabitEdit이 렌더링된다", async () => {
    renderApp("/habit/h1/edit");
    await waitFor(() => expect(screen.getByTestId("page-habit-edit")).toBeInTheDocument());
  });

  it("'/goal' 경로에서 Goal이 렌더링된다", async () => {
    renderApp("/goal");
    await waitFor(() => expect(screen.getByTestId("page-goal")).toBeInTheDocument());
  });
});

// ─── AC-4: 스모크 테스트 ─────────────────────────────────────────────────────

describe("AC-4: '/' 정상 렌더링 (스모크)", () => {
  it("'/' 경로에서 Home이 크래시 없이 렌더링된다", async () => {
    renderApp("/");
    await waitFor(() => expect(screen.getByTestId("page-home")).toBeInTheDocument());
  });

  it("AppStoreProvider가 마운트되어도 에러가 없다", async () => {
    expect(() => renderApp("/")).not.toThrow();
    await waitFor(() => expect(screen.getByTestId("page-home")).toBeInTheDocument());
  });
});
