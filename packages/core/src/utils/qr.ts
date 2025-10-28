import * as QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export class QRCodeService {
  /**
   * QR 코드 생성 (URL)
   */
  static async generateQRCodeURL(data: string, options: QRCodeOptions = {}): Promise<string> {
    try {
      const opts = {
        width: options.width || 300,
        margin: options.margin || 4,
        color: {
          dark: options.color?.dark || '#000000',
          light: options.color?.light || '#ffffff',
        },
      };

      return await QRCode.toDataURL(data, opts);
    } catch (error) {
      console.error('QR 코드 생성 오류:', error);
      throw new Error('QR 코드 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * QR 코드 생성 (Canvas)
   */
  static async generateQRCodeCanvas(data: string, canvas: HTMLCanvasElement, options: QRCodeOptions = {}): Promise<void> {
    try {
      const opts = {
        width: options.width || 300,
        margin: options.margin || 4,
        color: {
          dark: options.color?.dark || '#000000',
          light: options.color?.light || '#ffffff',
        },
      };

      await QRCode.toCanvas(canvas, data, opts);
    } catch (error) {
      console.error('QR 코드 생성 오류:', error);
      throw new Error('QR 코드 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * QR 코드 생성 (SVG)
   */
  static async generateQRCodeSVG(data: string, options: QRCodeOptions = {}): Promise<string> {
    try {
      const opts = {
        type: 'svg' as const,
        width: options.width || 300,
        margin: options.margin || 4,
        color: {
          dark: options.color?.dark || '#000000',
          light: options.color?.light || '#ffffff',
        },
      };

      return QRCode.toString(data, opts);
    } catch (error) {
      console.error('QR 코드 생성 오류:', error);
      throw new Error('QR 코드 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * QR 코드 URL 생성
   */
  static generateCouponQRURL(baseUrl: string, storeId: string, type: 'issue' | 'use'): string {
    const params = new URLSearchParams();
    params.set('store', storeId);
    params.set('type', type);
    
    return `${baseUrl}?${params.toString()}`;
  }
}