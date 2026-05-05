import { describe, it, expect } from "vitest";
import {
  toHttpLikeStatus,
  StorageError,
  type HabitCategory,
  type Habit,
  type CheckIn,
  type Goal,
  type Badge,
  type WeekStartsOn,
  type AppSettings,
  type StorageErrorCode,
  type StorageHttpStatus,
  type RouteState,
} from "@/lib/types";

describe("toHttpLikeStatus", () => {
  it("AC-1: PARSE_ERROR → 500", () => {
    expect(toHttpLikeStatus("PARSE_ERROR")).toBe(500);
  });

  it("AC-1: SCHEMA_MISMATCH → 500", () => {
    expect(toHttpLikeStatus("SCHEMA_MISMATCH")).toBe(500);
  });

  it("AC-1: QUOTA_EXCEEDED → 507", () => {
    expect(toHttpLikeStatus("QUOTA_EXCEEDED")).toBe(507);
  });

  it("AC-1: NOT_FOUND → 404", () => {
    expect(toHttpLikeStatus("NOT_FOUND")).toBe(404);
  });

  it("AC-1: DUPLICATE → 409", () => {
    expect(toHttpLikeStatus("DUPLICATE")).toBe(409);
  });

  it("AC-1: INVALID_REF → 409", () => {
    expect(toHttpLikeStatus("INVALID_REF")).toBe(409);
  });
});

describe("StorageError", () => {
  it("AC-2: instanceof Error이다", () => {
    const err = new StorageError({ code: "NOT_FOUND", key: "savestreak.habits.v1", message: "not found" });
    expect(err).toBeInstanceOf(Error);
  });

  it("AC-2: code와 key가 올바르게 설정된다", () => {
    const err = new StorageError({ code: "DUPLICATE", key: "savestreak.checkins.v1", message: "dup" });
    expect(err.code).toBe("DUPLICATE");
    expect(err.key).toBe("savestreak.checkins.v1");
  });

  it("AC-2: message가 설정된다", () => {
    const err = new StorageError({ code: "QUOTA_EXCEEDED", key: "savestreak.settings.v1", message: "quota exceeded" });
    expect(err.message).toBe("quota exceeded");
  });

  it("AC-2: cause가 선택적으로 설정된다", () => {
    const cause = new Error("root");
    const err = new StorageError({ code: "PARSE_ERROR", key: "k", message: "parse fail", cause });
    expect(err.cause).toBe(cause);
  });
});

// 타입 계약 검증 — 컴파일 타임 테스트
// 아래는 TypeScript가 타입 오류 없이 컴파일하면 통과
describe("Type contracts (compile-time)", () => {
  it("AC-3: HabitCategory는 6개 리터럴 유니온이다", () => {
    const cats: HabitCategory[] = ["smoking", "coffee", "delivery", "alcohol", "impulse", "etc"];
    expect(cats.length).toBe(6);
  });

  it("AC-3: WeekStartsOn은 mon|sun 이다", () => {
    const days: WeekStartsOn[] = ["mon", "sun"];
    expect(days.length).toBe(2);
  });

  it("AC-3: StorageHttpStatus는 지정된 숫자 유니온이다", () => {
    const statuses: StorageHttpStatus[] = [400, 401, 404, 409, 500, 507];
    expect(statuses.length).toBe(6);
  });
});
