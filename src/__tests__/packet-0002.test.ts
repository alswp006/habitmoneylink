import { describe, it, expect, beforeEach, vi } from "vitest";
import { StorageError } from "@/lib/types";

// 동적 import로 사이드이펙트 검증
describe("keys.ts — side-effect free", () => {
  it("AC-1: import 시 localStorage를 즉시 읽지 않는다", async () => {
    const spy = vi.spyOn(Storage.prototype, "getItem");
    await import("@/lib/storage/keys");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("AC-1: 5개 키 상수가 export 된다", async () => {
    const keys = await import("@/lib/storage/keys");
    expect(keys.HABITS_KEY).toBe("savestreak.habits.v1");
    expect(keys.CHECKINS_KEY).toBe("savestreak.checkins.v1");
    expect(keys.GOALS_KEY).toBe("savestreak.goals.v1");
    expect(keys.BADGES_KEY).toBe("savestreak.badges.v1");
    expect(keys.SETTINGS_KEY).toBe("savestreak.settings.v1");
  });
});

describe("readRaw", () => {

  it("AC-2: 키가 없으면 null을 반환한다", async () => {
    const { readRaw } = await import("@/lib/storage/base");
    expect(readRaw("nonexistent-key")).toBeNull();
  });

  it("AC-2: 키가 있으면 문자열을 반환한다", async () => {
    localStorage.setItem("test-key", "hello");
    const { readRaw } = await import("@/lib/storage/base");
    expect(readRaw("test-key")).toBe("hello");
  });

  it("AC-2: 예외를 throw하지 않는다", async () => {
    const { readRaw } = await import("@/lib/storage/base");
    expect(() => readRaw("any-key")).not.toThrow();
  });
});

describe("safeJsonParse", () => {
  it("AC-3: 유효한 JSON이면 파싱 결과를 반환한다", async () => {
    const { safeJsonParse } = await import("@/lib/storage/base");
    expect(safeJsonParse("k", '{"a":1}')).toEqual({ a: 1 });
  });

  it("AC-3: 잘못된 JSON이면 StorageError(PARSE_ERROR)를 throw한다", async () => {
    const { safeJsonParse } = await import("@/lib/storage/base");
    expect(() => safeJsonParse("savestreak.habits.v1", "not-json{{{")).toThrow(StorageError);
  });

  it("AC-3: PARSE_ERROR의 key가 전달된 key와 일치한다", async () => {
    const { safeJsonParse } = await import("@/lib/storage/base");
    try {
      safeJsonParse("savestreak.checkins.v1", "bad");
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(StorageError);
      expect((e as StorageError).code).toBe("PARSE_ERROR");
      expect((e as StorageError).key).toBe("savestreak.checkins.v1");
    }
  });
});

describe("safeSetItem", () => {
  it("AC-4: 정상 저장 시 예외를 throw하지 않는다", async () => {
    const { safeSetItem } = await import("@/lib/storage/base");
    expect(() => safeSetItem("test-key", '"value"')).not.toThrow();
    expect(localStorage.getItem("test-key")).toBe('"value"');
  });

  it("AC-4: QuotaExceededError 발생 시 StorageError(QUOTA_EXCEEDED)를 throw한다", async () => {
    const { safeSetItem } = await import("@/lib/storage/base");
    vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });
    expect(() => safeSetItem("k", "v")).toThrow(StorageError);
  });

  it("AC-4: QUOTA_EXCEEDED의 code와 key가 올바르다", async () => {
    const { safeSetItem } = await import("@/lib/storage/base");
    vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    try {
      safeSetItem("savestreak.goals.v1", "{}");
      expect.fail("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(StorageError);
      expect((e as StorageError).code).toBe("QUOTA_EXCEEDED");
      expect((e as StorageError).key).toBe("savestreak.goals.v1");
    }
  });
});
