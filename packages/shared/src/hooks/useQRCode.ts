import { useState, useCallback } from 'react';
import { QRCodeService } from '@myminglz/core';
import type { QRCodeOptions } from '@myminglz/types';

interface UseQRCodeOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export function useQRCode(options: UseQRCodeOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // QR 코드 URL 생성
  const generateQRCode = useCallback(async (data: string, qrOptions?: QRCodeOptions) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = await QRCodeService.generateQRCodeURL(data, qrOptions);
      setQrUrl(url);
      options.onSuccess?.(url);
      
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'QR 코드 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  // QR 코드 SVG 생성
  const generateSVG = useCallback(async (data: string, qrOptions?: QRCodeOptions) => {
    try {
      setLoading(true);
      setError(null);
      
      const svg = await QRCodeService.generateQRCodeSVG(data, qrOptions);
      options.onSuccess?.(svg);
      
      return svg;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'QR 코드 SVG 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  // 쿠폰용 QR 코드 URL 생성
  const generateCouponQR = useCallback((baseUrl: string, storeId: string, type: 'issue' | 'use') => {
    const url = QRCodeService.generateCouponQRURL(baseUrl, storeId, type);
    return url;
  }, []);

  // 상태 초기화
  const reset = useCallback(() => {
    setQrUrl(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    qrUrl,
    loading,
    error,
    generateQRCode,
    generateSVG,
    generateCouponQR,
    reset
  };
}

