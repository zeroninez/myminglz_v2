'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/test');  // 테스트 페이지로 리다이렉트
  }, []);

  return null;
}