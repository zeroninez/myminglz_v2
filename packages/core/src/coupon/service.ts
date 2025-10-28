import { createClient } from '@supabase/supabase-js';
import type { 
  Coupon, 
  CouponCreationData, 
  CouponUsageData,
  ApiResponse 
} from '@myminglz/shared';
import { createCouponSchema, useCouponSchema } from '@myminglz/shared';
import { QRCodeService } from '../utils/qr';

export class CouponService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // 쿠폰 생성
  async createCoupon(data: CouponCreationData): Promise<ApiResponse<Coupon>> {
    try {
      // 유효성 검증
      const validated = createCouponSchema.parse(data);

      // QR 코드 생성
      const qrData = JSON.stringify({
        type: 'coupon',
        storeId: validated.storeId,
        timestamp: Date.now()
      });
      const qrCode = await QRCodeService.generateQRCodeURL(qrData);

      // DB에 저장
      const { data: coupon, error } = await this.supabase
        .from('coupons')
        .insert([
          {
            ...validated,
            qrCode,
            isUsed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: coupon as Coupon
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '쿠폰 생성 실패'
      };
    }
  }

  // 쿠폰 사용
  async useCoupon(data: CouponUsageData): Promise<ApiResponse<Coupon>> {
    try {
      // 유효성 검증
      const validated = useCouponSchema.parse(data);

      // 쿠폰 상태 확인
      const { data: coupon, error: fetchError } = await this.supabase
        .from('coupons')
        .select('*')
        .eq('id', validated.couponId)
        .single();

      if (fetchError) throw fetchError;
      if (!coupon) throw new Error('쿠폰을 찾을 수 없습니다');
      if (coupon.isUsed) throw new Error('이미 사용된 쿠폰입니다');
      if (new Date(coupon.expiresAt) < new Date()) throw new Error('만료된 쿠폰입니다');

      // 쿠폰 사용 처리
      const { data: updatedCoupon, error: updateError } = await this.supabase
        .from('coupons')
        .update({
          isUsed: true,
          usedAt: new Date().toISOString(),
          usedBy: validated.userId,
          updatedAt: new Date().toISOString()
        })
        .eq('id', validated.couponId)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        data: updatedCoupon as Coupon
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '쿠폰 사용 실패'
      };
    }
  }

  // QR 코드로 쿠폰 조회
  async getCouponByQR(qrCode: string): Promise<ApiResponse<Coupon>> {
    try {
      const { data: coupon, error } = await this.supabase
        .from('coupons')
        .select('*')
        .eq('qrCode', qrCode)
        .single();

      if (error) throw error;
      if (!coupon) throw new Error('쿠폰을 찾을 수 없습니다');

      return {
        success: true,
        data: coupon as Coupon
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '쿠폰 조회 실패'
      };
    }
  }
}
