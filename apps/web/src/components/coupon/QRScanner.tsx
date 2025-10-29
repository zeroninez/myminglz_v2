import { forwardRef, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScanSuccess: (storeId: string, qrImageUrl: string) => void;
  onScanError?: (error: string) => void;
}

export const QRScanner = forwardRef<{ scanFile: (file: File) => void }, QRScannerProps>(({ onScanSuccess, onScanError }, ref) => {

  // scanFile 메서드를 부모 컴포넌트에 전달
  useEffect(() => {
    console.log('QRScanner ref 설정 시도...');
    if (ref && typeof ref === 'object') {
      console.log('ref 객체 발견, scanFile 설정 중...');
      ref.current = {
        scanFile: (file: File) => {
          console.log('scanFile 호출됨', file);
          scanFile(file);
        }
      };
      console.log('scanFile 설정 완료');
    } else {
      console.log('유효하지 않은 ref:', ref);
    }
  }, []);

  const generateQRImageFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        // QR 코드를 그릴 캔버스 생성
        const canvas = document.createElement('canvas');
        const size = 300; // QR 코드 크기
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // 이미지를 캔버스에 그리기 (정사각형으로 크롭)
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        
        // 캔버스를 이미지 URL로 변환
        const qrImageUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve(qrImageUrl);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };

  const scanFile = async (file: File): Promise<void> => {
    console.log('scanFile 함수 실행 시작', file);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = async () => {
        try {
          // 캔버스에 이미지 그리기
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            URL.revokeObjectURL(url);
            const errorMsg = 'Canvas를 생성할 수 없습니다.';
            onScanError?.(errorMsg);
            reject(new Error(errorMsg));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // 이미지 데이터 가져오기
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // jsQR로 QR 코드 스캔
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          URL.revokeObjectURL(url);
          
          if (code) {
            console.log("✅ QR Code detected:", code.data);
            console.log("QR Code 전체 데이터:", JSON.stringify(code.data));
            
            let storeSlug: string | null = null;
            
            // 1. URL 형식 체크: https://myminglz-validator.vercel.app/{store_slug}
            const urlMatch = code.data.trim().match(/^https?:\/\/[^\/]+\/([a-z0-9-_]+)$/i);
            if (urlMatch) {
              storeSlug = urlMatch[1].toLowerCase();
              console.log('✅ URL에서 추출된 가게 slug:', storeSlug);
            } else {
              // 2. store:{store_slug} 형식 체크
              const storeMatch = code.data.trim().match(/^store:([a-z0-9-_]+)$/i);
              if (storeMatch) {
                storeSlug = storeMatch[1].toLowerCase();
                console.log('✅ store: 형식에서 추출된 가게 slug:', storeSlug);
              }
            }
            
            if (storeSlug) {
              // QR 코드 이미지 생성
              const qrImageUrl = await generateQRImageFromFile(file);
              onScanSuccess(storeSlug, qrImageUrl);
              resolve();
            } else {
              console.log('❌ 잘못된 QR 코드 형식:', code.data);
              console.log('❌ 예상 형식: https://myminglz-validator.vercel.app/매장이름 또는 store:매장이름');
              const errorMsg = `유효하지 않은 QR 코드입니다.\n스캔된 데이터: "${code.data}"\n예상 형식: URL 또는 store:매장이름`;
              onScanError?.(errorMsg);
              reject(new Error(errorMsg));
            }
          } else {
            console.log('QR 코드를 찾을 수 없습니다');
            const errorMsg = 'QR 코드를 읽을 수 없습니다. 다른 이미지를 선택해주세요.';
            onScanError?.(errorMsg);
            reject(new Error(errorMsg));
          }
        } catch (error) {
          console.error("Scan error:", error);
          const errorMsg = 'QR 코드 스캔 중 오류가 발생했습니다.';
          onScanError?.(errorMsg);
          reject(new Error(errorMsg));
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        const errorMsg = '이미지를 불러올 수 없습니다.';
        onScanError?.(errorMsg);
        reject(new Error(errorMsg));
      };
      
      img.src = url;
    });
  };

  return (
    <div id="qr-reader" className="hidden" />
  );
});