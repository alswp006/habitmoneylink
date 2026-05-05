// ─── Domain Types ───────────────────────────────────────────────────────────

export type HabitCategory =
  | 'smoking'
  | 'coffee'
  | 'delivery'
  | 'alcohol'
  | 'impulse'
  | 'etc';

export interface Habit {
  id: string;
  category: HabitCategory;
  title: string;
  unitPriceKRW: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  habitId: string;
  date: string; // 'YYYY-MM-DD' KST
  savedAmountKRW: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmountKRW: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  title: string;
  unlockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WeekStartsOn = 'mon' | 'sun';

export interface AppSettings {
  id: string;
  weekStartsOn: WeekStartsOn;
  lastOpenedDate: string; // 'YYYY-MM-DD' KST
  promotionRewardGranted: boolean;
  aiDisclosureAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Storage Error Model ─────────────────────────────────────────────────────

export type StorageErrorCode =
  | 'PARSE_ERROR'
  | 'SCHEMA_MISMATCH'
  | 'QUOTA_EXCEEDED'
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'INVALID_REF';

export type StorageHttpStatus = 400 | 401 | 404 | 409 | 500 | 507;

export function toHttpLikeStatus(code: StorageErrorCode): StorageHttpStatus {
  switch (code) {
    case 'PARSE_ERROR':
    case 'SCHEMA_MISMATCH':
      return 500;
    case 'QUOTA_EXCEEDED':
      return 507;
    case 'NOT_FOUND':
      return 404;
    case 'DUPLICATE':
    case 'INVALID_REF':
      return 409;
  }
}

export class StorageError extends Error {
  code: StorageErrorCode;
  key: string;
  cause?: unknown;

  constructor(params: {
    code: StorageErrorCode;
    key: string;
    message: string;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'StorageError';
    this.code = params.code;
    this.key = params.key;
    this.cause = params.cause;
  }
}

// ─── Route State Contract ────────────────────────────────────────────────────

export type RouteState = {
  '/': undefined;
  '/habit/new':
    | undefined
    | { prefill?: Partial<Pick<Habit, 'category' | 'title' | 'unitPriceKRW'>> };
  '/habit/:habitId/edit': undefined;
  '/goal': undefined;
  '/report': undefined;
  '/badge': undefined;
  '/badge/unlock': undefined | { badgeId: Badge['id'] };
};
