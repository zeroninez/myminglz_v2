export interface Store {
  id: string;
  name: string;
  description?: string;
  location: string;
  isActive: boolean;
  staffCode?: string;  // 직원 인증용 코드
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreCreationData {
  name: string;
  description?: string;
  location: string;
  staffCode?: string;
}

export interface StoreStats {
  totalCoupons: number;
  usedCoupons: number;
  activeCoupons: number;
  averageUsageTime: number;  // 쿠폰 발급부터 사용까지 평균 시간
}
