import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockAll } from "@/__tests__/__helpers__/mocks";
import { getIsTossLoginIntegratedService } from "@apps-in-toss/web-framework";
import App from "@/App";

mockAll();

// ─── 페이지 스텁 (라우팅/가드 집중 테스트) ──────────────────────────────────

vi.mock("@/pages/Home", () => ({ default: () => React.createElement("div", { "data-testid": "page-home" }) }));
vi.mock("@/pages/HabitNew", () => ({ default: () => React.createElement("div", { "data-testid": "page-habit-new" }) }));
vi.mock("@/pages/HabitEdit", () => ({ default: () => React.createElement("div", { "data-testid": "page-habit-edit" }) }));
vi.mock("@/pages/Goal", () => ({ default: () => React.createElement("div", { "data-testid": "page-goal" }) }));
vi.mock("@/pages/Report", () => ({ default: () => React.createElement("div", { "data-testid": "page-report" }) }));
vi.mock("@/pages/Badge", () => ({ default: () => React.createElement("div", { "data-testid": "page-badge" }) }));
vi.mock("@/pages/BadgeUnlock", () => ({ default: () => React.createElement("div", { "data-testid": "page-badge-unlock" }) }));
vi.mock("@/pages/Blocking", () => ({ default: () => React.createElement("div", { "data-testid": "page-blocking" }) }));
vi.mock("@/lib/store/AppStore", () => ({
  useAppStore: () => ({}),
  AppStoreProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

function renderApp(path = "/") {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)),
  );
}

beforeEach(() => {
  vi.mocked(getIsTossLoginIntegratedService).mockResolvedValue(false);
});

// ─── AC-2: 세션 가드 ─────────────────────────────────────────────────────────

describe("AC-2: 세션 가드 throw → Blocking", () => {
  it("getIsTossLoginIntegratedService가 throw하면 Blocking이 렌더링된다", async () => {
    vi.mocked(getIsTossLoginIntegratedService).mockRejectedValueOnce(new Error("session"));
    renderApp("/");
    await waitFor(() => expect(screen.getByTestId("page-blocking")).toBeInTheDocument());
  });

  it("throw 시 다른 경로에서도 Blocking만 렌더링된다", async () => {
    vi.mocked(getIsTossLoginIntegratedService).mockRejectedValueOnce(new Error("session"));
    renderApp("/report");
    await waitFor(() => expect(screen.getByTestId("page-blocking")).toBeInTheDocument());
  });
});

// ─── AC-3: 정상 세션 → 라우팅 ───────────────────────────────────────────────

describe("AC-3: 정상 세션 → 라우팅", () => {
  it("'/' 경로에서 Home이 렌더링된다", async () => {
    renderApp("/");
    await waitFor(() => expect(screen.getByTestId("page-home")).toBeInTheDocument());
  });

  it("'/report' 경로에서 Report가 렌더링된다", async () => {
    renderApp("/report");
    await waitFor(() => expect(screen.getByTestId("page-report")).toBeInTheDocument());
  });

  it("'/badge' 경로에서 Badge가 렌더링된다", async () => {
    renderApp("/badge");
    await waitFor(() => expect(screen.getByTestId("page-badge")).toBeInTheDocument());
  });

  it("'/badge/unlock' 경로에서 BadgeUnlock이 렌더링된다", async () => {
    renderApp("/badge/unlock");
    await waitFor(() => expect(screen.getByTestId("page-badge-unlock")).toBeInTheDocument());
  });
});
