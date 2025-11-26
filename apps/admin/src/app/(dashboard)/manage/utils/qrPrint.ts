export const QR_SIZES = [357, 306, 204, 154] as const;
export type QRSize = typeof QR_SIZES[number];

export const IMAGE_FORMATS = ['png', 'jpg', 'svg'] as const;
export type ImageFormat = typeof IMAGE_FORMATS[number];

export interface QRCodeData {
  label: string;
  url: string;
  qrCodeUrl: string | null;
}

/**
 * 이미지를 지정한 사이즈로 리사이즈합니다.
 */
export const resizeImage = async (imageUrl: string, size: number, format: 'png' | 'jpg' = 'png'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다.'));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'jpg' ? 0.92 : undefined;
      resolve(canvas.toDataURL(mimeType, quality));
    };
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = imageUrl;
  });
};

/**
 * QR 코드를 인쇄합니다.
 */
export const printQRCode = async (
  qrData: QRCodeData,
  size: number
): Promise<void> => {
  if (!qrData.qrCodeUrl) return;

  let qrImageUrl = qrData.qrCodeUrl;

  // 선택한 사이즈로 리사이즈
  try {
    qrImageUrl = await resizeImage(qrData.qrCodeUrl, size);
  } catch (err) {
    console.error('QR 코드 리사이즈 오류:', err);
    throw err;
  }

  // 숨겨진 iframe 생성
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('iframe 문서를 가져올 수 없습니다.');
  }

  // 이미지가 로드된 후 iframe에 내용 작성
  const img = new Image();
  img.onload = () => {
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${qrData.label} - QR 코드 인쇄</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              width: 100vw;
              background: white;
            }
            .qr-image {
              width: ${size}px;
              height: ${size}px;
            }
            @media print {
              @page {
                margin: 0;
                size: auto;
              }
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <img src="${qrImageUrl}" alt="${qrData.label} QR 코드" class="qr-image" />
        </body>
      </html>
    `);
    iframeDoc.close();

    // iframe이 로드된 후 인쇄
    const iframeWindow = iframe.contentWindow;
    if (iframeWindow) {
      // 약간의 지연 후 인쇄 (DOM이 완전히 렌더링되도록)
      setTimeout(() => {
        try {
          iframeWindow.focus();
          iframeWindow.print();
        } catch (err) {
          console.error('인쇄 오류:', err);
          document.body.removeChild(iframe);
          throw err;
        }
      }, 100);

      // 인쇄 대화상자가 닫힌 후 iframe 제거
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  };
  img.onerror = () => {
    document.body.removeChild(iframe);
    throw new Error('이미지 로드 실패');
  };
  img.src = qrImageUrl;
};

/**
 * QR 코드를 파일로 저장합니다.
 */
export const saveQRCode = async (
  qrData: QRCodeData,
  size: number,
  format: ImageFormat,
  eventName?: string
): Promise<void> => {
  if (!qrData.qrCodeUrl) return;

  let blob: Blob;
  let fileName: string;

  if (format === 'svg') {
    // SVG는 QRCodeService를 통해 직접 생성
    const { QRCodeService } = await import('@myminglz/core/src/utils/qr');
    try {
      const svgString = await QRCodeService.generateQRCodeSVG(qrData.url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      
      blob = new Blob([svgString], { type: 'image/svg+xml' });
      fileName = `${eventName || 'QR'}_${qrData.label.replace(/\s+/g, '_')}_${size}x${size}.svg`;
    } catch (err) {
      console.error('QR 코드 SVG 생성 오류:', err);
      throw new Error('QR 코드 SVG 생성 중 오류가 발생했습니다.');
    }
  } else {
    // PNG/JPG는 Canvas를 통해 변환
    let qrImageUrl = qrData.qrCodeUrl;

    // 선택한 사이즈로 리사이즈
    try {
      qrImageUrl = await resizeImage(qrData.qrCodeUrl, size, format);
    } catch (err) {
      console.error('QR 코드 리사이즈 오류:', err);
      throw new Error('QR 코드 리사이즈 중 오류가 발생했습니다.');
    }

    try {
      // Base64 이미지를 Blob으로 변환
      const response = await fetch(qrImageUrl);
      blob = await response.blob();
      const extension = format === 'jpg' ? 'jpg' : 'png';
      fileName = `${eventName || 'QR'}_${qrData.label.replace(/\s+/g, '_')}_${size}x${size}.${extension}`;
    } catch (err) {
      console.error('QR 코드 저장 오류:', err);
      throw new Error('QR 코드 저장 중 오류가 발생했습니다.');
    }
  }

  try {
    // 다운로드 링크 생성
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // 정리
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('QR 코드 다운로드 오류:', err);
    throw new Error('QR 코드 다운로드 중 오류가 발생했습니다.');
  }
};

