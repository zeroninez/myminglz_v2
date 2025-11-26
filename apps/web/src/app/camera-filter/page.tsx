'use client';

import { useState } from 'react';
import { SimpleCameraOverlay } from '@/components/ar/SimpleCameraOverlay';

export default function CameraFilterPage() {
  // 테스트 이미지 생성 (데이터 URL)
  const testImageDataUrl = 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <circle cx="100" cy="100" r="80" fill="#FF6B6B" opacity="0.8"/>
      <text x="100" y="110" font-size="40" fill="white" text-anchor="middle" font-weight="bold">TEST</text>
    </svg>
  `);
  
  const [overlayUrl, setOverlayUrl] = useState<string>(testImageDataUrl);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">카메라 오버레이</h1>

        {/* 설정 패널 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            오버레이 이미지 URL (선택사항):
          </label>
          <input
            type="text"
            value={overlayUrl}
            onChange={(e) => setOverlayUrl(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 rounded text-white mb-2"
            placeholder="이미지 URL을 입력하세요"
          />
          <p className="text-xs text-gray-400 mb-4">
            예: https://example.com/image.png (빈 값이면 카메라만 표시됩니다)
          </p>
          <button
            onClick={() => setOverlayUrl(testImageDataUrl)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            테스트 이미지 사용
          </button>
        </div>

        {/* 카메라 뷰 */}
        <div className="bg-black rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <SimpleCameraOverlay overlayImageUrl={overlayUrl || undefined} />
        </div>
      </div>
    </div>
  );
}

