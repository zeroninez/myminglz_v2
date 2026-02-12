'use client';

import { useRouter } from 'next/navigation';

export default function PaymentPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">페이지를 찾을 수 없습니다.</p>
        <p className="mt-2 text-gray-500">결제관리 기능은 준비 중입니다.</p>
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            이전 페이지로
          </button>
          <button
            onClick={() => router.push('/event-home')}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    </div>
  );
}