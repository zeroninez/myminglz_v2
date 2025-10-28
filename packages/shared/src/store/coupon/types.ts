import type { Coupon, CouponCreationData, CouponUsageData } from '../../types/coupon/entity';

export interface CouponState {
  // 상태
  currentCoupon: Coupon | null;
  issuedCoupons: Coupon[];
  usedCoupons: Coupon[];
  isLoading: boolean;
  error: string | null;

  // 액션
  setCurrentCoupon: (coupon: Coupon | null) => void;
  addIssuedCoupon: (coupon: Coupon) => void;
  addUsedCoupon: (coupon: Coupon) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 비즈니스 로직
  createCoupon: (data: CouponCreationData) => Promise<void>;
  useCoupon: (data: CouponUsageData) => Promise<void>;
  getCouponByQR: (qrCode: string) => Promise<void>;
  clearCouponState: () => void;
}
