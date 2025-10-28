export interface Coupon {
  id: string;
  storeId: string;
  title: string;
  description?: string;
  qrCode: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  usedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponCreationData {
  storeId: string;
  title: string;
  description?: string;
  expiresAt: Date;
}

export interface CouponUsageData {
  couponId: string;
  userId: string;
  staffCode?: string;  // 직원 인증 코드
  location?: string;   // 사용 위치
}

export type CouponStatus = 'active' | 'used' | 'expired';
