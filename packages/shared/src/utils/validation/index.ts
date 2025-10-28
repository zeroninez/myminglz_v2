import { z } from 'zod';

// 쿠폰 생성 스키마
export const createCouponSchema = z.object({
  storeId: z.string().min(1, '매장 ID는 필수입니다'),
  title: z.string().min(1, '제목은 필수입니다').max(100, '제목은 100자를 초과할 수 없습니다'),
  description: z.string().max(500, '설명은 500자를 초과할 수 없습니다').optional(),
  expiresAt: z.date().min(new Date(), '만료일은 현재 시간 이후여야 합니다')
});

// 쿠폰 사용 스키마
export const useCouponSchema = z.object({
  couponId: z.string().min(1, '쿠폰 ID는 필수입니다'),
  userId: z.string().min(1, '사용자 ID는 필수입니다'),
  staffCode: z.string().min(1, '직원 인증 코드는 필수입니다'),
  location: z.string().optional()
});

// 매장 생성 스키마
export const createStoreSchema = z.object({
  name: z.string().min(1, '매장 이름은 필수입니다').max(100, '매장 이름은 100자를 초과할 수 없습니다'),
  description: z.string().max(500, '설명은 500자를 초과할 수 없습니다').optional(),
  location: z.string().min(1, '위치는 필수입니다'),
  staffCode: z.string().min(6, '직원 인증 코드는 최소 6자 이상이어야 합니다').optional()
});

// 타입 추론을 위한 export
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UseCouponInput = z.infer<typeof useCouponSchema>;
export type CreateStoreInput = z.infer<typeof createStoreSchema>;
