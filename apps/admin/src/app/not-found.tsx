'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-900">404</h1>
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800">페이지를 찾을 수 없습니다</h2>
          <p className="mt-4 text-gray-600">
            요청하신 페이지가 존재하지 않거나 준비 중입니다.
          </p>
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/event-home"
            className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
          >
            홈으로 가기
          </Link>
        </div>
      </div>
    </div>
  );
}