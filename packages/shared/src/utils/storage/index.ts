// 브라우저 스토리지 관리
const STORAGE_KEYS = {
  COUPON: 'mingle_coupon',
  AUTH: 'mingle_auth',
  STORE: 'mingle_store'
} as const;

export class StorageManager {
  // 쿠폰 정보 저장
  static saveCoupon(couponId: string, data: any): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.COUPON}_${couponId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save coupon:', error);
    }
  }

  // 쿠폰 정보 조회
  static getCoupon(couponId: string): any | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.COUPON}_${couponId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get coupon:', error);
      return null;
    }
  }

  // 쿠폰 정보 삭제
  static removeCoupon(couponId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.COUPON}_${couponId}`);
    } catch (error) {
      console.error('Failed to remove coupon:', error);
    }
  }

  // 모든 쿠폰 정보 조회
  static getAllCoupons(): any[] {
    try {
      return Object.entries(localStorage)
        .filter(([key]) => key.startsWith(STORAGE_KEYS.COUPON))
        .map(([_, value]) => JSON.parse(value));
    } catch (error) {
      console.error('Failed to get all coupons:', error);
      return [];
    }
  }

  // 스토리지 초기화
  static clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(prefix => {
        Object.keys(localStorage)
          .filter(key => key.startsWith(prefix))
          .forEach(key => localStorage.removeItem(key));
      });
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}
