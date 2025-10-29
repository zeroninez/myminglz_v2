'use client';

import { useRef, useState } from 'react';
import { QRScanner } from '@/components/coupon/QRScanner';
import { QRPlaceholder } from '@/components/ui/coupon/QRPlaceholder';
import { ActionSheet, ActionSheetButton, ActionSheetButtonGroup } from '@/components/ui/ActionSheet';

interface ValidateFormProps {
  couponCode?: string;
  onScan: (result: string) => void;
}

export function ValidateForm({ couponCode, onScan }: ValidateFormProps) {
  const scannerRef = useRef<{ startScanner: () => void } | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      <div className="px-5 pt-16">
        <h1 className="text-gray-900 text-[32px] font-bold leading-[1.3] mb-3">
          매장 내 비치된<br />
          QR코드를<br />
          촬영해주세요
        </h1>

        <p className="text-gray-600 text-[15px] mb-8">
          QR코드 위치는 점원에게 문의해주세요
        </p>

        <div className="bg-gray-50 border-2 border-gray-200 rounded-[20px] p-5">
          <h2 className="text-[17px] font-bold text-gray-900 mb-4">
            주의사항
          </h2>
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
              <span className="text-gray-400 text-xs font-bold">!</span>
            </div>
            <p className="text-[15px] text-gray-600 leading-[1.5]">
              스캔이 안된 촬영 후 업로드까지 완료해주세요
            </p>
          </div>
        </div>

        <QRPlaceholder className="mt-8" />

        <QRScanner onScanSuccess={onScan} ref={scannerRef} />
      </div>

      <button
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] h-[56px] bg-gray-900 text-white text-[17px] font-semibold rounded-[16px] shadow-lg active:bg-gray-800"
        onClick={() => {
          setShowActionSheet(true);
        }}
      >
        QR코드 촬영하기
      </button>

      {showActionSheet && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowActionSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-gray-50 z-50 pb-10 pt-2 rounded-t-[20px]">
            <div className="w-[90%] max-w-[320px] mx-auto flex flex-col gap-2">
              <div className="w-full bg-white rounded-[14px] overflow-hidden shadow-sm">
                <button
                  className="w-full h-[56px] text-[17px] font-medium text-gray-900 active:bg-gray-50"
                  onClick={() => {
                    if (scannerRef.current?.startScanner) {
                      scannerRef.current.startScanner();
                      setShowActionSheet(false);
                    }
                  }}
                >
                  카메라로 촬영
                </button>
                <button
                  className="w-full h-[56px] text-[17px] font-medium text-gray-900 border-t border-gray-200 active:bg-gray-50"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file && scannerRef.current?.startScanner) {
                        scannerRef.current.startScanner();
                        setShowActionSheet(false);
                      }
                    };
                    input.click();
                  }}
                >
                  앨범에서 선택
                </button>
              </div>
              <button
                className="w-full h-[56px] text-[17px] font-semibold bg-white rounded-[14px] text-gray-900 active:bg-gray-50 shadow-sm"
                onClick={() => setShowActionSheet(false)}
              >
                취소
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
