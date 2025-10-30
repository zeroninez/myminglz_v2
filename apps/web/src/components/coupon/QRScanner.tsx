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
    console.log('파일 타입:', file.type);
    console.log('파일 크기:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      const errorMsg = '이미지 파일만 업로드할 수 있습니다.';
      onScanError?.(errorMsg);
      throw new Error(errorMsg);
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        if (!e.target?.result) {
          const errorMsg = '파일을 읽을 수 없습니다.';
          onScanError?.(errorMsg);
          reject(new Error(errorMsg));
          return;
        }
        
        const imageUrl = e.target.result as string;
        const img = new Image();
        
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              const errorMsg = 'Canvas를 생성할 수 없습니다.';
              onScanError?.(errorMsg);
              reject(new Error(errorMsg));
              return;
            }
            
            // 캔버스 크기 설정
            canvas.width = img.width;
            canvas.height = img.height;
            
            // 이미지를 캔버스에 그리기
            ctx.drawImage(img, 0, 0);
            
            // 이미지 데이터 가져오기
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // 안전한 jsQR 호출 함수
            const safeJsQR = (data: Uint8ClampedArray, width: number, height: number, options: any) => {
              try {
                if (data && width > 0 && height > 0 && data.length === width * height * 4) {
                  return jsQR(data, width, height, options);
                }
                return null;
              } catch (error) {
                console.warn('jsQR 호출 실패:', error);
                return null;
              }
            };
            
            let qrCode = null;
            
            // 1차 시도: 기본 설정
            console.log('🔍 1차 시도: 기본 스캔...');
            qrCode = safeJsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            
            // 2차 시도: 색상 반전
            if (!qrCode) {
              console.log('🔍 2차 시도: 색상 반전...');
              qrCode = safeJsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "onlyInvert",
              });
            }
            
            // 3차 시도: 모든 옵션
            if (!qrCode) {
              console.log('🔍 3차 시도: 모든 옵션...');
              qrCode = safeJsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
              });
            }
            
            // 4차 시도: 중앙 부분만 크롭하여 스캔
            if (!qrCode && canvas.width > 100 && canvas.height > 100) {
              console.log('🔍 4차 시도: 중앙 영역 스캔...');
              const centerX = Math.floor(canvas.width * 0.25);
              const centerY = Math.floor(canvas.height * 0.25);
              const centerWidth = Math.floor(canvas.width * 0.5);
              const centerHeight = Math.floor(canvas.height * 0.5);
              
              const centerImageData = ctx.getImageData(
                centerX,
                centerY,
                centerWidth,
                centerHeight
              );
              
              qrCode = safeJsQR(
                centerImageData.data,
                centerImageData.width,
                centerImageData.height,
                {
                  inversionAttempts: "attemptBoth",
                }
              );
            }
            
            // QR 코드 발견 여부 확인
            if (qrCode && qrCode.data) {
              console.log("✅ QR Code detected:", qrCode.data);
              console.log("QR Code 전체 데이터:", JSON.stringify(qrCode.data));
              
              let storeSlug: string | null = null;
              
              // 1. URL 형식 체크: https://myminglz-validator.vercel.app/{store_slug}
              const urlMatch = qrCode.data.trim().match(/^https?:\/\/[^\/]+\/([a-z0-9-_]+)$/i);
              if (urlMatch) {
                storeSlug = urlMatch[1].toLowerCase();
                console.log('✅ URL에서 추출된 가게 slug:', storeSlug);
              } else {
                // 2. store:{store_slug} 형식 체크
                const storeMatch = qrCode.data.trim().match(/^store:([a-z0-9-_]+)$/i);
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
                console.log('❌ 잘못된 QR 코드 형식:', qrCode.data);
                console.log('❌ 예상 형식: https://myminglz-validator.vercel.app/매장이름 또는 store:매장이름');
                const errorMsg = `유효하지 않은 QR 코드입니다.\n스캔된 데이터: "${qrCode.data}"\n예상 형식: URL 또는 store:매장이름`;
                onScanError?.(errorMsg);
                reject(new Error(errorMsg));
              }
            } else {
              console.log('❌ QR 코드를 찾을 수 없습니다 (4차 시도 모두 실패)');
              const errorMsg = 'QR 코드를 인식할 수 없습니다.\n\n• QR 코드가 선명하게 보이도록 재촬영해주세요\n• 조명이 밝은 곳에서 촬영해주세요\n• QR 코드 전체가 화면에 들어오도록 해주세요';
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
          const errorMsg = '이미지를 불러올 수 없습니다.';
          onScanError?.(errorMsg);
          reject(new Error(errorMsg));
        };
        
        img.src = imageUrl;
      };
      
      reader.onerror = () => {
        const errorMsg = '파일을 읽을 수 없습니다.';
        onScanError?.(errorMsg);
        reject(new Error(errorMsg));
      };
      
      reader.readAsDataURL(file);
    });
  };

  return (
    <div id="qr-reader" className="hidden" />
  );
});