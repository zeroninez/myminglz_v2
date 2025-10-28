import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Coupon,
  Location,
  Store,
  CouponWithDetails,
  GenerateCodeResult,
  SaveCodeResult,
  ValidateCodeResult,
  LocationStats,
  StoreStats,
} from '@myminglz/types';

export class CouponService {
  private static supabase: SupabaseClient | null = null;

  static initialize(supabaseUrl: string, supabaseKey: string): void {
    if (!this.supabase) {
      console.log('Creating new Supabase client with URL:', supabaseUrl);
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  private static checkInitialized(): SupabaseClient {
    if (!this.supabase) {
      console.error('Supabase client is not initialized');
      throw new Error('Supabase가 초기화되지 않았습니다.');
    }
    return this.supabase;
  }

  /**
   * 장소 정보 조회 (slug로)
   */
  static async getLocationBySlug(slug: string): Promise<Location | null> {
    try {
      const supabase = this.checkInitialized();
      console.log('Searching for location with slug:', slug);
      // 데이터 가져오기
      const { data: locations, error: queryError } = await supabase
        .from('locations')
        .select()
        .eq('slug', slug)
        .eq('is_active', true)
        .limit(1);

      if (queryError) {
        console.error('Location query error:', queryError);
        console.error('Full error object:', JSON.stringify(queryError, null, 2));
        return null;
      }

      // 결과가 없거나 여러 개인 경우 처리
      if (!locations || locations.length === 0) {
        console.log('No location found with slug:', slug);
        return null;
      }

      if (locations.length > 1) {
        console.warn('Multiple locations found with slug:', slug);
      }

      // 첫 번째 결과 사용
      const data = locations[0];
      console.log('Location found:', data);
      return data;
    } catch (error) {
      console.error('장소 조회 오류:', error);
      return null;
    }
  }

  /**
   * 가게 정보 조회 (slug로)
   */
  static async getStoreBySlug(slug: string): Promise<Store | null> {
    try {
      const supabase = this.checkInitialized();
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      console.error('가게 조회 오류:', error);
      return null;
    }
  }

  /**
   * 쿠폰 코드 생성
   */
  private static async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    // 8자리 랜덤 생성
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 중복 체크
    const supabase = this.checkInitialized();
    const { data, error } = await supabase
      .from('coupons')
      .select('code')
      .eq('code', code);

    if (error) {
      console.error('Code check error:', error);
      // 에러 발생 시 타임스탬프를 추가한 코드 반환
      return `${code.slice(0, 4)}${Date.now().toString().slice(-4)}`;
    }

    // 중복이면 타임스탬프 추가
    return (data && data.length > 0) ? `${code.slice(0, 4)}${Date.now().toString().slice(-4)}` : code;
  }

  /**
   * 특정 장소에서 쿠폰 코드 생성
   */
  // 로컬 스토리지 관련 메서드 제거

  static async generateCodeForLocation(locationSlug: string): Promise<GenerateCodeResult> {
    try {
      if (!this.checkInitialized()) {
        return {
          success: false,
          error: 'Supabase가 초기화되지 않았습니다. 환경 변수를 확인해주세요.',
        };
      }

      const location = await this.getLocationBySlug(locationSlug);
      if (!location) {
        return {
          success: false,
          error: `'${locationSlug}' 장소를 찾을 수 없습니다. 데이터베이스에 해당 장소가 존재하는지 확인해주세요.`,
        };
      }

      const code = await this.generateUniqueCode();

      return {
        success: true,
        code,
        location,
      };
    } catch (error) {
      console.error('코드 생성 오류:', error);
      return {
        success: false,
        error: '코드 생성 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 장소별 코드 저장
   */
  static async saveCodeForLocation(code: string, locationSlug: string): Promise<SaveCodeResult> {
    try {
      if (!this.checkInitialized()) {
        return {
          success: false,
          error: 'Supabase가 초기화되지 않았습니다.'
        };
      }
      console.log('Saving code for location:', { code, locationSlug });
      
      const location = await this.getLocationBySlug(locationSlug);
      if (!location) {
        console.error('Location not found:', locationSlug);
        return {
          success: false,
          error: '유효하지 않은 장소입니다.',
        };
      }

      console.log('Found location:', location);

      const insertData = {
        code: code.toUpperCase(),
        location_id: location.id,
        is_used: false,
        created_at: new Date().toISOString()
      };

      console.log('Inserting coupon data:', insertData);

      const supabase = this.checkInitialized();
      const { data, error } = await supabase
        .from('coupons')
        .insert([insertData])
        .select(`
          *,
          location:locations(*),
          store:stores!coupons_store_id_fkey(*)
        `)
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned after insert');
        return {
          success: false,
          error: '쿠폰 데이터를 찾을 수 없습니다.',
        };
      }

      console.log('Successfully saved coupon:', data);
      
      return {
        success: true,
        coupon: data as CouponWithDetails,
        message: `${location.name} 방문 쿠폰\n코드: ${code}\n발급이 완료되었습니다!`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('코드 저장 오류:', { error, message: errorMessage });
      return {
        success: false,
        error: `코드 저장 중 오류가 발생했습니다: ${errorMessage}`,
      };
    }
  }

  /**
   * 가게에서 쿠폰 코드 검증
   */
  static async validateCodeAtStore(code: string, storeSlug: string): Promise<ValidateCodeResult> {
    try {
      const store = await this.getStoreBySlug(storeSlug);
      if (!store) {
        const result: ValidateCodeResult = {
          success: false,
          isValid: false,
          error: '유효하지 않은 가게입니다.',
        };
        return result;
      }

      const upperCode = code.toUpperCase().trim();
      if (!upperCode) {
        const result: ValidateCodeResult = {
          success: false,
          isValid: false,
          error: '코드를 입력해주세요.',
        };
        return result;
      }

      // 코드 조회 (해당 가게의 장소에서 발급된 코드만)
      const supabase = this.checkInitialized();
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          location:locations(*),
          validated_by_store:stores!validated_by_store_id(*)
        `)
        .eq('code', upperCode)
        .eq('location_id', store.location_id)
        .single();

      if (error || !data) {
        const result: ValidateCodeResult = {
          success: true,
          isValid: false,
          message: '사용이 불가한 쿠폰이에요...\n확인 후 다시 인증해주세요!',
        };
        return result;
      }

      if (data.is_used) {
        const usedAtStore = data.validated_by_store?.name || '다른 곳';
        const result: ValidateCodeResult = {
          success: true,
          isValid: true,
          isUsed: true,
          location: data.location,
          store,
          message: `이미 ${usedAtStore}에서 사용된 코드입니다.`,
        };
        return result;
      }

      // 쿠폰 만료일 체크
      const location = data.location;
      if (location.coupon_expiry_days !== null && location.coupon_expiry_days !== undefined) {
        const now = new Date();
        const createdAt = new Date(data.created_at);
        
        // 만료일 계산 (당일이면 발급일 자정까지, 아니면 해당 날짜 자정까지)
        const expiryDate = new Date(createdAt);
        expiryDate.setDate(expiryDate.getDate() + location.coupon_expiry_days - 1);
        expiryDate.setHours(23, 59, 59, 999);
        
        if (now > expiryDate) {
          const result: ValidateCodeResult = {
            success: true,
            isValid: false,
            message: `쿠폰이 만료되었습니다.\n(발급일: ${createdAt.toLocaleDateString()}, 만료일: ${expiryDate.toLocaleDateString()})`,
          };
          return result;
        }
      }

      const result: ValidateCodeResult = {
        success: true,
        isValid: true,
        isUsed: false,
        location: data.location,
        store,
        message: `✅ ${data.location.name} 방문이 확인되었습니다!`,
      };
      return result;
    } catch (error) {
      console.error('코드 검증 오류:', error);
      return {
        success: false,
        isValid: false,
        error: '코드 확인 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 가게에서 쿠폰 사용 처리
   */
  static async useCouponAtStore(code: string, storeSlug: string): Promise<SaveCodeResult> {
    try {
      const validationResult = await this.validateCodeAtStore(code, storeSlug);
      if (!validationResult.success || !validationResult.isValid || validationResult.isUsed) {
        return {
          success: false,
          error: validationResult.message || validationResult.error || '알 수 없는 오류가 발생했습니다.',
        };
      }

      const store = validationResult.store!;
      const upperCode = code.toUpperCase().trim();

      const supabase = this.checkInitialized();
      const { data, error} = await supabase
        .from('coupons')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          validated_at: new Date().toISOString(),
          validated_by_store_id: store.id,
        })
        .eq('code', upperCode)
        .select(`
          *,
          location:locations(*),
          store:stores(*),
          validated_by_store:stores!validated_by_store_id(*)
        `)
        .single();

      if (error) throw error;

      const result: SaveCodeResult = {
        success: true,
        coupon: data as CouponWithDetails,
        message: `✅ ${validationResult.location!.name} 방문 쿠폰이 ${store.name}에서 사용 완료되었습니다!`,
      };
      return result;
    } catch (error) {
      console.error('쿠폰 사용 처리 오류:', error);
      return {
        success: false,
        error: '쿠폰 사용 처리 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 장소별 통계 조회
   */
  static async getLocationStats(locationSlug: string): Promise<LocationStats | null> {
    try {
      if (!this.checkInitialized()) {
        return null;
      }
      const location = await this.getLocationBySlug(locationSlug);
      if (!location) return null;

      const supabase = this.checkInitialized();
      const { count: totalCount } = await supabase
        .from('coupons')
        .select('id', { count: 'exact' })
        .eq('location_id', location.id);

      const { count: usedCount } = await supabase
        .from('coupons')
        .select('id', { count: 'exact' })
        .eq('location_id', location.id)
        .eq('is_used', true);

      const total = totalCount ?? 0;
      const used = usedCount ?? 0;
      const unused = total - used;
      const usage_rate = total > 0 ? Math.round((used / total) * 100) : 0;

      return {
        location,
        total,
        used,
        unused,
        usage_rate,
      };
    } catch (error) {
      console.error('장소 통계 조회 오류:', error);
      return null;
    }
  }

  /**
   * 가게별 통계 조회
   */
  /**
   * 쿠폰 코드로 쿠폰 정보 조회
   */
  // 로컬 스토리지 관련 메서드 제거

  static async getCouponByCode(code: string): Promise<{ data: CouponWithDetails | null; error?: string }> {
    try {
      console.log('getCouponByCode called with code:', code);
      
      // Supabase 초기화 체크
      if (!this.checkInitialized()) {
        console.error('Supabase not initialized');
        return {
          data: null,
          error: 'Supabase가 초기화되지 않았습니다. 환경 변수를 확인해주세요.'
        };
      }

      const supabase = this.checkInitialized();
      console.log('Supabase client initialized successfully');
      
      const upperCode = code.toUpperCase();
      console.log('Searching for coupon with uppercase code:', upperCode);
      
      const query = supabase
        .from('coupons')
        .select(`
          *,
          location:locations(*),
          store:stores!coupons_store_id_fkey(*),
          validated_by_store:stores!coupons_validated_by_store_id_fkey(*)
        `)
        .eq('code', upperCode)
        .single();

      console.log('Executing Supabase query...');
      const { data, error } = await query;
      console.log('Query completed. Data:', data, 'Error:', error);

      if (error) {
        console.error('Coupon query error:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        return {
          data: null,
          error: '쿠폰을 찾을 수 없습니다.'
        };
      }

      return {
        data: data as CouponWithDetails
      };
    } catch (error) {
      console.error('쿠폰 조회 오류:', error);
      return {
        data: null,
        error: '쿠폰 조회 중 오류가 발생했습니다.'
      };
    }
  }

  static async getCouponByStoreAndCode(storeSlug: string, code: string): Promise<{ data: CouponWithDetails | null; error?: string }> {
    try {
      if (!this.checkInitialized()) {
        return {
          data: null,
          error: 'Supabase가 초기화되지 않았습니다.'
        };
      }

      // 먼저 매장 정보 조회
      const store = await this.getStoreBySlug(storeSlug);
      if (!store) {
        return {
          data: null,
          error: '매장을 찾을 수 없습니다.'
        };
      }

      // 해당 매장의 쿠폰 조회
      const supabase = this.checkInitialized();
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          location:locations(*),
          store:stores(*)
        `)
        .eq('code', code.toUpperCase())
        .eq('location_id', store.location_id)
        .single();

      if (error) {
        console.error('Coupon query error:', error);
        return {
          data: null,
          error: '쿠폰을 찾을 수 없습니다.'
        };
      }

      return {
        data: data as CouponWithDetails
      };
    } catch (error) {
      console.error('쿠폰 조회 오류:', error);
      return {
        data: null,
        error: '쿠폰 조회 중 오류가 발생했습니다.'
      };
    }
  }

  static async getStoreStats(storeSlug: string): Promise<StoreStats | null> {
    try {
      const store = await this.getStoreBySlug(storeSlug);
      if (!store) return null;

      const supabase = this.checkInitialized();
      const { count: validatedCount } = await supabase
        .from('coupons')
        .select('id', { count: 'exact' })
        .eq('validated_by_store_id', store.id);

      return {
        store,
        validated: validatedCount ?? 0,
      };
    } catch (error) {
      console.error('가게 통계 조회 오류:', error);
      return null;
    }
  }
}