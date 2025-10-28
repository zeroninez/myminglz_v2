import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { CouponState } from './types';
import type { Coupon } from '../../types/coupon/entity';
import { StorageManager } from '../../utils/storage';

// 초기 상태
const initialState = {
  currentCoupon: null,
  issuedCoupons: [],
  usedCoupons: [],
  isLoading: false,
  error: null
};

export const useCouponStore = create<CouponState>()(
  devtools(
    persist(
      (set, get) => ({
        // 상태
        ...initialState,

        // 액션
        setCurrentCoupon: (coupon) => {
          set({ currentCoupon: coupon });
          if (coupon) {
            StorageManager.saveCoupon(coupon.id, coupon);
          }
        },

        addIssuedCoupon: (coupon) => {
          set((state) => ({
            issuedCoupons: [...state.issuedCoupons, coupon]
          }));
        },

        addUsedCoupon: (coupon) => {
          set((state) => ({
            usedCoupons: [...state.usedCoupons, coupon],
            issuedCoupons: state.issuedCoupons.filter(c => c.id !== coupon.id)
          }));
        },

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        // 비즈니스 로직
        createCoupon: async (data) => {
          const { setLoading, setError, addIssuedCoupon } = get();
          try {
            setLoading(true);
            setError(null);
            
            // API 호출은 core 패키지의 CouponService를 통해 수행
            const response = await window.fetch('/api/coupons', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            addIssuedCoupon(result.data);
          } catch (error) {
            setError(error instanceof Error ? error.message : '쿠폰 생성 실패');
          } finally {
            setLoading(false);
          }
        },

        useCoupon: async (data) => {
          const { setLoading, setError, addUsedCoupon } = get();
          try {
            setLoading(true);
            setError(null);

            const response = await window.fetch('/api/coupons/use', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            addUsedCoupon(result.data);
          } catch (error) {
            setError(error instanceof Error ? error.message : '쿠폰 사용 실패');
          } finally {
            setLoading(false);
          }
        },

        getCouponByQR: async (qrCode) => {
          const { setLoading, setError, setCurrentCoupon } = get();
          try {
            setLoading(true);
            setError(null);

            const response = await window.fetch(`/api/coupons/qr/${qrCode}`);
            const result = await response.json();
            
            if (!result.success) throw new Error(result.error);
            setCurrentCoupon(result.data);
          } catch (error) {
            setError(error instanceof Error ? error.message : '쿠폰 조회 실패');
          } finally {
            setLoading(false);
          }
        },

        clearCouponState: () => {
          set(initialState);
          StorageManager.clearAll();
        }
      }),
      {
        name: 'coupon-storage',
        partialize: (state) => ({
          issuedCoupons: state.issuedCoupons,
          usedCoupons: state.usedCoupons
        })
      }
    )
  )
);
