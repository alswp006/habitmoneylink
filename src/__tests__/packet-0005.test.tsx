import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { mockTds } from "@/__tests__/__helpers__/mocks";
import { HeroSummaryCard } from "@/components/HeroSummaryCard";

mockTds();

describe("AC-1: HeroSummaryCard 렌더링", () => {
  it("accumulatedLabel과 accumulatedValue가 표시된다", () => {
    render(
      <HeroSummaryCard
        accumulatedLabel="누적 절약액"
        accumulatedValue="12,300원"
        goalSummary=""
      />,
    );
    expect(screen.getByText("누적 절약액")).toBeInTheDocument();
    expect(screen.getByText("12,300원")).toBeInTheDocument();
  });

  it("goalSummary가 있으면 해당 문구가 표시된다", () => {
    render(
      <HeroSummaryCard
        accumulatedLabel="누적 절약액"
        accumulatedValue="12,300원"
        goalSummary="아이폰까지 D-10"
      />,
    );
    expect(screen.getByText("아이폰까지 D-10")).toBeInTheDocument();
  });

  it("goalSummary가 빈 문자열이면 안내 문구가 표시된다", () => {
    render(
      <HeroSummaryCard
        accumulatedLabel="누적 절약액"
        accumulatedValue="0원"
        goalSummary=""
      />,
    );
    expect(screen.getByText(/목표를 설정하면/)).toBeInTheDocument();
  });

  it("'목표 설정' 버튼이 렌더링된다", () => {
    render(
      <HeroSummaryCard
        accumulatedLabel="누적 절약액"
        accumulatedValue="0원"
        goalSummary=""
      />,
    );
    expect(screen.getByRole("button", { name: "목표 설정" })).toBeInTheDocument();
  });
});

describe("AC-3: onGoalClick 콜백", () => {
  it("버튼 탭 시 onGoalClick이 정확히 1회 호출된다", () => {
    const onGoalClick = vi.fn();
    render(
      <HeroSummaryCard
        accumulatedLabel="누적 절약액"
        accumulatedValue="0원"
        goalSummary=""
        onGoalClick={onGoalClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "목표 설정" }));
    expect(onGoalClick).toHaveBeenCalledTimes(1);
  });

  it("onGoalClick 없이도 크래시하지 않는다", () => {
    render(
      <HeroSummaryCard
        accumulatedLabel="누적 절약액"
        accumulatedValue="0원"
        goalSummary=""
      />,
    );
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: "목표 설정" })),
    ).not.toThrow();
  });
});
