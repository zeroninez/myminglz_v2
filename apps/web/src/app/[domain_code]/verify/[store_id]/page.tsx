/**
 * 이벤트 쿠폰 검증 페이지
 * URL: /[domain_code]/verify/[store_id]
 * 
 * 사용처에서 QR 코드를 스캔하여 이벤트 쿠폰 사용을 검증하는 페이지
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QRScanner } from '@/components/coupon/QRScanner';
import { QRPlaceholder } from '@/components/ui/coupon/QRPlaceholder';

export default function EventVerifyPage() {
  const params = useParams();
  const domainCode = params.domain_code as string;
  const storeId = params.store_id as string;
  const router = useRouter();

  const [isScanning, setIsScanning] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // QR 스캔 성공 처리
  const handleScanSuccess = async (scannedData: string, qrImage: string) => {
    console.log('🔍 QR 스캔 완료:', { scannedData, expectedStoreId: storeId, domainCode });
    
    // QR 코드에서 store_id 추출
    let scannedStoreId: string | null = null;
    
    // 1. URL 형식 체크: https://myminglz-v2-web.vercel.app/{domain_code}/verify/{store_id}
    const urlMatch = scannedData.trim().match(/\/verify\/([a-z0-9-_]+)$/i);
    if (urlMatch) {
      scannedStoreId = urlMatch[1];
      console.log('✅ URL에서 추출된 store_id:', scannedStoreId);
    } else {
      // 2. 직접 store_id 형식 (QRScanner가 이미 파싱한 경우)
      scannedStoreId = scannedData;
    }
    
    // 스캔한 store_id와 현재 페이지의 store_id가 일치하는지 확인
    if (scannedStoreId !== storeId) {
      setErrorMessage('이 사용처의 QR 코드가 아닙니다.');
      setIsScanning(false);
      return;
    }

    setQrImageUrl(qrImage);
    setIsValidated(true);
    setIsScanning(false);
    setErrorMessage(null);
  };

  // QR 스캔 에러 처리
  const handleScanError = (error: string) => {
    console.error('❌ 스캔 에러:', error);
    setErrorMessage(error);
    setIsScanning(false);
  };

  // 스캔 시작
  const handleStartScan = () => {
    setIsScanning(true);
    setErrorMessage(null);
    setIsValidated(false);
    setQrImageUrl(null);
  };

  // 스캔 취소
  const handleCancelScan = () => {
    setIsScanning(false);
    setErrorMessage(null);
  };

  // 직원 확인 버튼 클릭
  const handleStaffConfirmClick = () => {
    setShowConfirmModal(true);
  };

  // 확인 모달 닫기
  const handleConfirmModalClose = () => {
    setShowConfirmModal(false);
  };

  // 쿠폰 사용 확인 처리
  const handleConfirmUse = async () => {
    if (isConfirming) return;

    setShowConfirmModal(false);
    setIsConfirming(true);

    try {
      // TODO: API 호출하여 이벤트 쿠폰 사용 완료 처리
      // await fetch(`/api/events/${domainCode}/verify/${storeId}`, { method: 'POST' });
      
      console.log('✅ 이벤트 쿠폰 사용 완료 처리');
      
      // 성공 시 완료 페이지로 이동
      router.push(`/${domainCode}/verify/${storeId}/complete`);
    } catch (error) {
      console.error('❌ 쿠폰 사용 처리 실패:', error);
      setErrorMessage('쿠폰 사용 처리 중 오류가 발생했습니다.');
      setIsValidated(false);
      setQrImageUrl(null);
    } finally {
      setIsConfirming(false);
    }
  };

  // 스캔 중일 때는 전체 화면 카메라 뷰 표시
  if (isScanning) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
          isScanning={isScanning}
        />

        {/* 취소 버튼 */}
        <button
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          onClick={handleCancelScan}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white px-6 py-16 flex flex-col items-center">
        {/* 상단 텍스트 */}
        <div className="text-center mb-8">
          <h1 className="text-gray-900 text-[32px] font-bold mb-3 leading-tight">
            매장 내 비치된<br />
            QR코드를<br />
            촬영해주세요
          </h1>
          <p className="text-gray-600 text-[15px]">
            QR코드 위치는 점원에게 문의해주세요
          </p>
        </div>

        {/* 주의사항 */}
        <div className="w-full max-w-[343px] mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-xl">!</span>
            <p className="text-gray-700 text-sm">
              QR 코드를 카메라 중앙에 맞춰주세요
            </p>
          </div>
        </div>

        {/* QR 코드 표시 영역 */}
        <div className="w-full max-w-[343px] mb-6">
          {errorMessage ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          ) : isValidated && qrImageUrl ? (
            <div className="flex flex-col items-center">
              <img
                src={qrImageUrl}
                alt="스캔된 QR 코드"
                className="w-48 h-48 rounded-lg border-2 border-gray-200 mb-4"
              />
              <p className="text-green-600 text-sm font-medium">QR 코드 검증 완료</p>
            </div>
          ) : (
            <QRPlaceholder className="" />
          )}
        </div>

        {/* 검증 완료 후 직원 확인 버튼 또는 QR 촬영 버튼 */}
        <div className="w-full max-w-[343px]">
          {isValidated ? (
            <button
              onClick={handleStaffConfirmClick}
              disabled={isConfirming}
              className="w-full h-[56px] bg-gray-900 text-white text-[17px] font-semibold rounded-[16px] shadow-lg transition-colors active:bg-gray-800 disabled:opacity-50"
            >
              {isConfirming ? '처리 중...' : '직원 확인'}
            </button>
          ) : (
            <button
              onClick={handleStartScan}
              className="w-full h-[56px] bg-gray-900 text-white text-[17px] font-semibold rounded-[16px] shadow-lg transition-colors active:bg-gray-800"
            >
              QR코드 촬영하기
            </button>
          )}
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-5">
          <div className="bg-white rounded-[20px] w-full max-w-[300px] p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-600 text-2xl">!</span>
            </div>
            <h3 className="text-[18px] font-bold text-gray-900 mb-2">
              쿠폰을 사용하시겠습니까?
            </h3>
            <p className="text-[14px] text-gray-600 mb-6">
              쿠폰을 사용한 후에는 재발급해야합니다
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 h-[48px] bg-gray-100 text-gray-900 text-[15px] font-medium rounded-[12px] active:bg-gray-200"
                onClick={handleConfirmModalClose}
              >
                취소
              </button>
              <button
                className="flex-1 h-[48px] bg-gray-900 text-white text-[15px] font-semibold rounded-[12px] active:bg-gray-800"
                onClick={handleConfirmUse}
                disabled={isConfirming}
              >
                {isConfirming ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

