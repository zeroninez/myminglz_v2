import QRCode from 'qrcode';

export const generateQRCode = async (text: string, options = { width: 200 }): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: options.width,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR 코드 생성 실패:', err);
    throw new Error('QR 코드 생성에 실패했습니다.');
  }
};


