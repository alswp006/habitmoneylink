import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockAll, mockNavigate, mockLocation } from "@/__tests__/__helpers__/mocks";
import HabitNewPage from "@/pages/HabitNew";

mockAll();

const mockCreateHabit = vi.fn();

vi.mock("@/lib/store/AppStore", () => ({
  useAppStore: () => ({
    isHydrating: false,
    storageError: null,
    habits: [],
    checkIns: [],
    goals: [],
    badges: [],
    settings: null,
    habitsById: new Map(),
    checkInsByHabitId: new Map(),
    checkInsByDate: new Map(),
    checkInUniqSet: new Set(),
    activeGoal: null,
    resetAll: vi.fn(),
    createHabit: mockCreateHabit,
    updateHabit: vi.fn(),
    deleteHabit: vi.fn(),
    createCheckIn: vi.fn(),
    upsertActiveGoal: vi.fn(),
    unlockBadge: vi.fn(),
  }),
  AppStoreProvider: ({ children }: { children: React.ReactNode }) => children,
}));

function renderPage(state: unknown = null) {
  (mockLocation as { state: unknown }).state = state;
  return render(
    React.createElement(MemoryRouter, null, React.createElement(HabitNewPage)),
  );
}

beforeEach(() => {
  mockCreateHabit.mockClear();
  mockNavigate.mockClear();
  mockLocation.state = null;
});

// ─── AC-1: 카테고리 BottomSheet ───────────────────────────────────────────────

describe("AC-1: 카테고리 BottomSheet", () => {
  it("카테고리 행 탭 시 시트가 열리고 6개 옵션이 표시된다", () => {
    renderPage();
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByText("카테고리").closest("[role='listitem']")!);
    const dialog = screen.getByRole("dialog");
    ["담배", "커피", "배달", "술", "충동구매", "기타"].forEach((name) => {
      expect(within(dialog).getByText(name)).toBeInTheDocument();
    });
  });

  it("카테고리 탭 시 선택값이 화면에 반영된다", () => {
    renderPage();
    fireEvent.click(screen.getByText("카테고리").closest("[role='listitem']")!);
    fireEvent.click(
      within(screen.getByRole("dialog")).getByText("커피").closest("[role='listitem']")!,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("커피")).toBeInTheDocument();
  });
});

// ─── AC-2: 금액 유효성 ────────────────────────────────────────────────────────

describe("AC-2: 금액 TextField 유효성", () => {
  it("금액 입력 필드는 inputMode=numeric이다", () => {
    renderPage();
    const inputs = screen.getAllByRole("textbox");
    const amountInput = inputs[1] as HTMLInputElement;
    expect(amountInput.inputMode).toBe("numeric");
  });

  it("숫자 외 문자 입력 후 저장 탭 시 createHabit이 호출되지 않는다", () => {
    renderPage();
    const amountInput = screen.getAllByRole("textbox")[1];
    fireEvent.change(amountInput, { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(mockCreateHabit).not.toHaveBeenCalled();
  });

  it("숫자 외 문자 입력 후 저장 탭 시 에러 alert가 표시된다", () => {
    renderPage();
    const amountInput = screen.getAllByRole("textbox")[1];
    fireEvent.change(amountInput, { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

// ─── AC-3: 저장 → createHabit + navigate('/') ──────────────────────────────

describe("AC-3: 저장 버튼", () => {
  it("유효 입력 후 저장 시 createHabit 1회 호출 + navigate('/')된다", () => {
    renderPage();
    // 카테고리 선택
    fireEvent.click(screen.getByText("카테고리").closest("[role='listitem']")!);
    fireEvent.click(
      within(screen.getByRole("dialog")).getByText("커피").closest("[role='listitem']")!,
    );
    // 금액 입력
    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "3000" } });
    // 저장
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(mockCreateHabit).toHaveBeenCalledTimes(1);
    expect(mockCreateHabit).toHaveBeenCalledWith({
      category: "coffee",
      title: "커피",
      unitPriceKRW: 3000,
    });
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

// ─── DoD: prefill ─────────────────────────────────────────────────────────────

describe("DoD: prefill", () => {
  it("prefill.title이 있으면 제목 필드 초기값으로 반영된다", () => {
    renderPage({ prefill: { title: "아메리카노", category: "coffee", unitPriceKRW: 4500 } });
    const titleInput = screen.getAllByRole("textbox")[0] as HTMLInputElement;
    expect(titleInput.value).toBe("아메리카노");
  });

  it("prefill 없으면 빈 값으로 시작한다", () => {
    renderPage();
    const titleInput = screen.getAllByRole("textbox")[0] as HTMLInputElement;
    expect(titleInput.value).toBe("");
  });
});
