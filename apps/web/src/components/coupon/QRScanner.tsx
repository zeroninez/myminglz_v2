import { forwardRef, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (storeId: string) => void;
  onScanError?: (error: string) => void;
}

export const QRScanner = forwardRef<{ startScanner: () => void }, QRScannerProps>(({ onScanSuccess, onScanError }, ref) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // startScanner 메서드를 부모 컴포넌트에 전달
  useEffect(() => {
    console.log('QRScanner ref 설정 시도...');
    if (ref && typeof ref === 'object') {
      console.log('ref 객체 발견, startScanner 설정 중...');
      ref.current = {
        startScanner: () => {
          console.log('startScanner 호출됨');
          startScanner();
        }
      };
      console.log('startScanner 설정 완료');
    } else {
      console.log('유효하지 않은 ref:', ref);
    }
  }, []);

  const startScanner = async () => {
    console.log('startScanner 함수 실행 시작');
    try {
      // 이미 스캐닝 중이면 중단
      if (isScanning) {
        return;
      }

      // 스캐너 요소를 보이게 만듦
      const readerElement = document.getElementById("qr-reader");
      if (readerElement) {
        readerElement.style.display = "block";
      }

      // 새로운 스캐너 인스턴스 생성
      if (!scannerRef.current) {
        console.log("Creating new scanner instance");
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      setIsScanning(true);

      console.log('카메라 목록 가져오기 시도...');
      const devices = await Html5Qrcode.getCameras();
      console.log('사용 가능한 카메라:', devices);
      console.log("Available cameras:", devices);

      if (devices && devices.length > 0) {
        const cameraId = devices[0].id;
        console.log("Starting camera with ID:", cameraId);

        await scannerRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          async (decodedText) => {
            console.log("QR Code detected:", decodedText);
            try {
            // store:{store_slug} 형식 체크
            const match = decodedText.match(/^store:([a-z0-9-]+)$/);
            if (match) {
              const storeSlug = match[1];
              console.log('스캔된 가게 slug:', storeSlug);
              // 스캔 성공 시 스캐너 중지
              await stopScanner();
              onScanSuccess(storeSlug);
            } else {
              console.log('잘못된 QR 코드 형식:', decodedText);
              onScanError?.('유효하지 않은 QR 코드입니다. 올바른 가게 QR 코드를 스캔해주세요.');
              }
            } catch (error) {
              console.error("QR processing error:", error);
              onScanError?.('QR 코드 처리 중 오류가 발생했습니다.');
            }
          },
          (errorMessage) => {
            console.log("QR Code scan error:", errorMessage);
          }
        );
      } else {
        console.error("No cameras found");
        onScanError?.('카메라를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error("Scanner start error:", error);
      onScanError?.('카메라 시작 중 오류가 발생했습니다.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        const readerElement = document.getElementById("qr-reader");
        if (readerElement) {
          readerElement.style.display = "none";
        }
      } catch (error) {
        console.error("Scanner stop error:", error);
      }
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <>
      <div
        id="qr-reader"
        className="fixed inset-0 bg-black z-50 hidden"
      />
      {isScanning && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={stopScanner}
        />
      )}
    </>
  );
});