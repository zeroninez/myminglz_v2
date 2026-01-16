'use client';

interface EventCreationSuccessModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export default function EventCreationSuccessModal({ isOpen, onConfirm }: EventCreationSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 pointer-events-auto relative">
          {/* 체크 아이콘 */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* 제목 */}
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-4 mt-4">
            이벤트 생성 완료
          </h2>

          {/* 설명 */}
          <div className="text-sm text-gray-600 text-center mb-6 space-y-1">
            <p>이벤트 제작이 모두 완료되어 이벤트가 생성되었습니다.</p>
            <p>전체 이벤트 관리 페이지에서 확인하고 관리할 수 있습니다.</p>
          </div>

          {/* 확인 버튼 */}
          <div className="flex justify-center">
            <button
              onClick={onConfirm}
              className="px-6 py-2 rounded-lg bg-[#6C7885] text-white text-sm font-medium hover:bg-[#5a6673] transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
