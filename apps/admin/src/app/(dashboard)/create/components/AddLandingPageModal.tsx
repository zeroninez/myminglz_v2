'use client';

interface AddLandingPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function AddLandingPageModal({ isOpen, onClose, onConfirm }: AddLandingPageModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40" 
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 pointer-events-auto">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 제목 */}
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-4">
            추가 랜딩페이지 제작
          </h2>

          {/* 설명 */}
          <p className="text-sm text-gray-600 text-center mb-6">
            추가 페이지는 템플릿과 레이아웃을 선택해 제작할 수 있으며, 기본 랜딩페이지에 연결해 확장하여 구성할 수 있습니다.
          </p>

          {/* 버튼들 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              제작 안 함
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-[#6C7885] text-white text-sm font-medium hover:bg-[#5a6673] transition-colors"
            >
              제작
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
