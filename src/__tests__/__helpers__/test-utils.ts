/**
 * Shared render + mock utilities for Toss Mini App tests.
 *
 * Usage:
 *   import { renderWithRouter, mockAppState } from "@/__tests__/__helpers__/test-utils";
 *
 *   it("renders home page", () => {
 *     renderWithRouter(<Home />);
 *   });
 */

import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { vi } from "vitest";

// ── Render with MemoryRouter ──
export function renderWithRouter(
  ui: ReactElement,
  routerOptions?: MemoryRouterProps,
  renderOptions?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) =>
      React.createElement(MemoryRouter, routerOptions, children),
    ...renderOptions,
  });
}

// ── AppStore / AppState mock factory ──
// NOTE: vi.mock() inside functions is hoisted by vitest to module level, which
// causes ReferenceError when factory closures reference function-local variables.
// Use vi.mock() at the TOP LEVEL of each test file instead.
// mockAppState is kept for API compatibility but the mock must be registered
// separately in the test file.
export function mockAppState(overrides: Partial<AppStateMock> = {}): AppStateMock {
  return {
    input: {},
    applyPreset: vi.fn(),
    updateField: vi.fn(),
    setInput: vi.fn(),
    reset: vi.fn(),
    isLoading: false,
    error: null,
    ...overrides,
  };
}

export interface AppStateMock {
  input: Record<string, unknown>;
  applyPreset: ReturnType<typeof vi.fn>;
  updateField: ReturnType<typeof vi.fn>;
  setInput: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  isLoading: boolean;
  error: string | null;
}

// ── Fake timers helper for rAF-driven code (animations, countups) ──
export async function advanceTimers(ms: number) {
  vi.useFakeTimers();
  vi.advanceTimersByTime(ms);
  await vi.runAllTimersAsync();
  vi.useRealTimers();
}

// ── localStorage seeding helper ──
export function seedLocalStorage(entries: Record<string, unknown>) {
  for (const [key, value] of Object.entries(entries)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// ── fetch mock helper ──
export function mockFetchOnce(response: unknown, options?: { status?: number; ok?: boolean }) {
  const fetchMock = vi.fn().mockResolvedValueOnce({
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: async () => response,
    text: async () => (typeof response === "string" ? response : JSON.stringify(response)),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}
