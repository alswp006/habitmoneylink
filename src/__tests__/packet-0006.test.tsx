import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { mockTds } from "@/__tests__/__helpers__/mocks";
import { HabitListRow } from "@/components/HabitListRow";

mockTds();

describe("AC-1: HabitListRow 렌더링", () => {
  it("title이 표시된다", () => {
    render(
      <HabitListRow
        title="커피"
        bottomText="3,000원 아꼈어요"
      />,
    );
    expect(screen.getByText("커피")).toBeInTheDocument();
  });

  it("bottomText가 표시된다", () => {
    render(
      <HabitListRow
        title="커피"
        bottomText="3,000원 아꼈어요"
      />,
    );
    expect(screen.getByText("3,000원 아꼈어요")).toBeInTheDocument();
  });

  it("'오늘 참았어요' 버튼이 렌더링된다", () => {
    render(
      <HabitListRow
        title="커피"
        bottomText="3,000원 아꼈어요"
      />,
    );
    expect(screen.getByRole("button", { name: "오늘 참았어요" })).toBeInTheDocument();
  });
});

describe("AC-3: 콜백 분리", () => {
  it("버튼 탭 시 onCheckInClick만 1회 호출된다", () => {
    const onRowClick = vi.fn();
    const onCheckInClick = vi.fn();
    render(
      <HabitListRow
        title="커피"
        bottomText="3,000원 아꼈어요"
        onRowClick={onRowClick}
        onCheckInClick={onCheckInClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "오늘 참았어요" }));
    expect(onCheckInClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("행 탭 시 onRowClick만 1회 호출된다", () => {
    const onRowClick = vi.fn();
    const onCheckInClick = vi.fn();
    render(
      <HabitListRow
        title="커피"
        bottomText="3,000원 아꼈어요"
        onRowClick={onRowClick}
        onCheckInClick={onCheckInClick}
      />,
    );
    fireEvent.click(screen.getByRole("listitem"));
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onCheckInClick).not.toHaveBeenCalled();
  });

  it("onRowClick/onCheckInClick 없이도 크래시하지 않는다", () => {
    render(
      <HabitListRow
        title="커피"
        bottomText="3,000원 아꼈어요"
      />,
    );
    expect(() => {
      fireEvent.click(screen.getByRole("button", { name: "오늘 참았어요" }));
      fireEvent.click(screen.getByRole("listitem"));
    }).not.toThrow();
  });
});
