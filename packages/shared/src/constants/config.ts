// 환경 설정
export const ENV = {
  PRODUCTION: process.env.NODE_ENV === 'production',
  DEVELOPMENT: process.env.NODE_ENV === 'development',
  TEST: process.env.NODE_ENV === 'test'
} as const;

// API 설정
export const API = {
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000
} as const;

// 쿠폰 관련 설정
export const COUPON = {
  DEFAULT_EXPIRY_DAYS: 30,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  QR_SIZE: 256
} as const;

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const;

// 테마 설정
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
} as const;

// 에러 코드
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
} as const;
