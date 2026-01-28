'use client';

import { useEffect, useRef } from 'react';

export default function TokenRefresher() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('토큰 갱신 실패, 로그인 페이지로 이동');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('토큰 갱신 오류:', error);
    }
  };

  useEffect(() => {
    // 45분마다 토큰 갱신 (JWT 토큰이 1시간 후 만료되므로 여유를 두고 갱신)
    intervalRef.current = setInterval(refreshToken, 45 * 60 * 1000);

    // 페이지 포커스 시에도 토큰 갱신
    const handleFocus = () => {
      refreshToken();
    };

    // 페이지 가시성 변경 시에도 토큰 갱신
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshToken();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}