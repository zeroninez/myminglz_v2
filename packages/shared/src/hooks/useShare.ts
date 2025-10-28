import { useState, useCallback } from 'react';
import { ShareService } from '@myminglz/core';
import type { ShareData, ShareResult } from '@myminglz/types';

interface UseShareOptions {
  onSuccess?: (result: ShareResult) => void;
  onError?: (error: string) => void;
}

export function useShare(options: UseShareOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastShareResult, setLastShareResult] = useState<ShareResult | null>(null);

  // 네이티브 공유
  const shareNative = useCallback(async (data: ShareData) => {
    try {
      setLoading(true);
      setError(null);

      if (!ShareService.canShare(data)) {
        throw new Error('이 브라우저에서는 공유 기능을 지원하지 않습니다.');
      }
      
      const result = await ShareService.shareNative(data);
      setLastShareResult(result);
      
      if (result.success) {
        options.onSuccess?.(result);
      } else {
        throw new Error(result.error || '공유에 실패했습니다.');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '공유 중 오류가 발생했습니다.';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [options]);

  // 인스타그램 스토리 공유
  const shareToInstagram = useCallback(async (data: ShareData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ShareService.shareToInstagramStory(data);
      setLastShareResult(result);
      
      if (result.success) {
        options.onSuccess?.(result);
      } else {
        throw new Error(result.error || '인스타그램 공유에 실패했습니다.');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '인스타그램 공유 중 오류가 발생했습니다.';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [options]);

  // 클립보드 복사
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const success = await ShareService.copyToClipboard(text);
      
      if (success) {
        options.onSuccess?.({ success: true, platform: 'native' });
      } else {
        throw new Error('클립보드 복사에 실패했습니다.');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '클립보드 복사 중 오류가 발생했습니다.';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [options]);

  // 상태 초기화
  const reset = useCallback(() => {
    setLastShareResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    lastShareResult,
    shareNative,
    shareToInstagram,
    copyToClipboard,
    canShare: ShareService.canShare,
    reset
  };
}

