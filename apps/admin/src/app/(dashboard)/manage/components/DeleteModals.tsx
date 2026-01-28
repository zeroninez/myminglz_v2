'use client';

interface DeleteModalsProps {
  showBulkDeleteConfirm: boolean;
  showDeleteConfirm: string | null;
  selectedEventIds: Set<string>;
  deletingBulk: boolean;
  deletingEventId: string | null;
  onBulkDeleteConfirm: () => void;
  onBulkDeleteCancel: () => void;
  onDeleteConfirm: (eventId: string) => void;
  onDeleteCancel: () => void;
}

export default function DeleteModals({
  showBulkDeleteConfirm,
  showDeleteConfirm,
  selectedEventIds,
  deletingBulk,
  deletingEventId,
  onBulkDeleteConfirm,
  onBulkDeleteCancel,
  onDeleteConfirm,
  onDeleteCancel
}: DeleteModalsProps) {
  return (
    <>
      {/* 일괄 삭제 확인 모달 */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              이벤트 삭제 확인
            </h3>
            <p className="text-gray-600 mb-6">
              정말로 선택된 {selectedEventIds.size}개의 이벤트를 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-medium">
                이 작업은 되돌릴 수 없으며, 관련된 모든 데이터(쿠폰, 매장, 방문 기록 등)가 함께 삭제됩니다.
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onBulkDeleteCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={deletingBulk}
              >
                취소
              </button>
              <button
                onClick={onBulkDeleteConfirm}
                disabled={deletingBulk}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingBulk ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              이벤트 삭제 확인
            </h3>
            <p className="text-gray-600 mb-6">
              정말로 이 이벤트를 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-medium">
                이 작업은 되돌릴 수 없으며, 관련된 모든 데이터(쿠폰, 매장, 방문 기록 등)가 함께 삭제됩니다.
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onDeleteCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={deletingEventId !== null}
              >
                취소
              </button>
              <button
                onClick={() => onDeleteConfirm(showDeleteConfirm)}
                disabled={deletingEventId !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingEventId ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}