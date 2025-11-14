'use client';

import { useEffect } from 'react';

interface EventMissionSectionProps {
  initialData?: { mission_config?: any };
  onDataChange?: (data: { mission_config?: any }) => void;
}

export default function EventMissionSection({ initialData, onDataChange }: EventMissionSectionProps) {
  // initialData가 있으면 부모에 알림
  useEffect(() => {
    if (initialData && onDataChange) {
      onDataChange(initialData);
    }
  }, [initialData, onDataChange]);
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">이벤트 미션</h3>
      <p className="mt-2 text-sm text-gray-500">
        미션 조건, 인증 방식, 리워드 구성을 설정하는 영역입니다.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="h-32 rounded-lg border border-dashed border-gray-300 bg-gray-50"></div>
        <div className="h-32 rounded-lg border border-dashed border-gray-300 bg-gray-50"></div>
      </div>
    </section>
  );
}



