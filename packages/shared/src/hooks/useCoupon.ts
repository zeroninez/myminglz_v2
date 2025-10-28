import { useState, useCallback } from 'react';
import { CouponService } from '@myminglz/core';
import type { Coupon, SaveCodeResult, ValidateCodeResult } from '@myminglz/types';

interface UseCouponOptions {
  onSuccess?: (result: SaveCodeResult) => void;
  onError?: (error: string) => void;
}

export function useCoupon(options: UseCouponOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  // 쿠폰 발급
  const issueCoupon = useCallback(async (storeId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await CouponService.issueCoupon(storeId);
      
      if (result.success && result.coupon) {
        setCoupon(result.coupon);
        options.onSuccess?.(result);
      } else {
        throw new Error(result.error || '쿠폰 발급에 실패했습니다.');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '쿠폰 발급 중 오류가 발생했습니다.';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [options]);

  // 쿠폰 검증
  const validateCoupon = useCallback(async (code: string, storeId: string): Promise<ValidateCodeResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await CouponService.validateCoupon(code, storeId);
      
      if (!result.success) {
        throw new Error(result.error || '쿠폰 검증에 실패했습니다.');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '쿠폰 검증 중 오류가 발생했습니다.';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [options]);

  // 쿠폰 사용
  const useCoupon = useCallback(async (code: string, storeId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await CouponService.useCoupon(code, storeId);
      
      if (result.success) {
        setCoupon(null); // 사용된 쿠폰 상태 초기화
        options.onSuccess?.(result);
      } else {
        throw new Error(result.error || '쿠폰 사용에 실패했습니다.');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '쿠폰 사용 중 오류가 발생했습니다.';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [options]);

  // 상태 초기화
  const reset = useCallback(() => {
    setCoupon(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    coupon,
    loading,
    error,
    issueCoupon,
    validateCoupon,
    useCoupon,
    reset
  };
}