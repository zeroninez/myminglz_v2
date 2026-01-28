'use client';

import { QR_SIZES, IMAGE_FORMATS, type QRSize, type ImageFormat, type QRCodeData } from '../utils/qrPrint';

interface Event {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  event_info_config?: {
    stores?: Array<{ id?: string; name: string }>;
  } | null;
  created_at: string;
  updated_at: string;
}

interface QRModalProps {
  selectedEvent: Event | null;
  qrCodes: QRCodeData[];
  qrLoading: boolean;
  qrModalType: 'event' | 'store';
  selectedSizes: Record<number, QRSize>;
  selectedFormats: Record<number, ImageFormat>;
  sizeSelectMode: Record<number, 'print' | 'save' | null>;
  onClose: () => void;
  onPrintClick: (index: number) => void;
  onSaveClick: (index: number) => void;
  onSizeConfirm: (index: number) => void;
  onSizeCancel: (index: number) => void;
  onSizeChange: (index: number, size: QRSize) => void;
  onFormatChange: (index: number, format: ImageFormat) => void;
}

export default function QRModal({
  selectedEvent,
  qrCodes,
  qrLoading,
  qrModalType,
  selectedSizes,
  selectedFormats,
  sizeSelectMode,
  onClose,
  onPrintClick,
  onSaveClick,
  onSizeConfirm,
  onSizeCancel,
  onSizeChange,
  onFormatChange
}: QRModalProps) {
  if (!selectedEvent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {selectedEvent.name} - {qrModalType === 'event' ? '이벤트' : '사용처'} QR 코드
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {qrLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-sm text-gray-500">QR 코드 생성 중...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {qrCodes.map((qrData, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {qrData.label}
                      </h4>
                      <p className="text-sm text-gray-600 break-all">
                        {qrData.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {sizeSelectMode[index] ? (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="text-sm font-medium text-gray-700">
                          {sizeSelectMode[index] === 'print' ? '인쇄' : '저장'} 설정:
                        </label>
                        <select
                          value={selectedSizes[index] || 357}
                          onChange={(e) => {
                            const newSize = Number(e.target.value) as QRSize;
                            onSizeChange(index, newSize);
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {QR_SIZES.map((size) => (
                            <option key={size} value={size}>
                              {size}x{size}
                            </option>
                          ))}
                        </select>
                        {sizeSelectMode[index] === 'save' && (
                          <select
                            value={selectedFormats[index] || 'png'}
                            onChange={(e) => {
                              const newFormat = e.target.value as ImageFormat;
                              onFormatChange(index, newFormat);
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {IMAGE_FORMATS.map((format) => (
                              <option key={format} value={format}>
                                {format.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => onSizeConfirm(index)}
                          className={`px-3 py-1.5 text-sm text-white rounded-lg hover:opacity-90 transition-colors ${
                            sizeSelectMode[index] === 'print'
                              ? 'bg-blue-500 hover:bg-blue-600'
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          확인
                        </button>
                        <button
                          onClick={() => onSizeCancel(index)}
                          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onPrintClick(index)}
                          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          title="인쇄"
                        >
                          인쇄
                        </button>
                        <button
                          onClick={() => onSaveClick(index)}
                          className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          title="저장"
                        >
                          저장
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {qrData.qrCodeUrl && (
                  <div className="flex justify-center">
                    <img
                      src={qrData.qrCodeUrl}
                      alt={`${qrData.label} QR 코드`}
                      className="w-48 h-48"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}