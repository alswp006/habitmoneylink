import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockTds } from "@/__tests__/__helpers__/mocks";
import BlockingPage from "@/pages/Blocking";

mockTds();

describe("AC-S0-1: Blocking 화면 렌더링", () => {
  it("Top 타이틀에 '세션을 확인할 수 없어요'가 표시된다", () => {
    render(<BlockingPage />);
    expect(screen.getByText("세션을 확인할 수 없어요")).toBeInTheDocument();
  });

  it("'토스 앱에서 다시 열어주세요.' 안내 문구가 표시된다", () => {
    render(<BlockingPage />);
    expect(screen.getByText("토스 앱에서 다시 열어주세요.")).toBeInTheDocument();
  });

  it("버튼이 없다", () => {
    render(<BlockingPage />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("링크가 없다", () => {
    render(<BlockingPage />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
