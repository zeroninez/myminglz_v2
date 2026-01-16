'use client';

interface ConfirmEventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmEventCreationModal({ isOpen, onClose, onConfirm }: ConfirmEventCreationModalProps) {
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
          {/* 제목 */}
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
            모든 설정이 완료되었습니다.
          </h2>

          {/* 설명 */}
          <p className="text-base text-gray-900 text-center mb-6">
            이벤트를 최종으로 생성하시겠습니까?
          </p>

          {/* 버튼들 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-[#4A5568] text-white text-sm font-medium hover:bg-[#3d4551] transition-colors"
            >
              생성
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
