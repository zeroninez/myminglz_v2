import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ImageUploadResult, ImageDeleteResult, ImageListResult, CouponServiceConfig } from '@myminglz/types';

export class ImageService {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(config: CouponServiceConfig, bucketName: string = 'coupon-images') {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.bucketName = bucketName;
  }

  /**
   * 이미지 업로드
   */
  async uploadImage(file: File, path: string): Promise<ImageUploadResult> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(path, file);

      if (error) throw error;

      const { data: publicUrl } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path);

      return {
        success: true,
        path: data.path,
        publicUrl: publicUrl.publicUrl,
      };
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      return {
        success: false,
        error: '이미지 업로드 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 이미지 삭제
   */
  async deleteImage(path: string): Promise<ImageDeleteResult> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      return {
        success: false,
        error: '이미지 삭제 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 이미지 목록 조회
   */
  async listImages(prefix?: string): Promise<ImageListResult> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(prefix || '');

      if (error) throw error;

      return {
        success: true,
        files: data,
      };
    } catch (error) {
      console.error('이미지 목록 조회 오류:', error);
      return {
        success: false,
        error: '이미지 목록 조회 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 이미지 최적화 (리사이징)
   */
  static async optimizeImage(file: File, maxWidth: number = 1200): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'));
          return;
        }

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('이미지 변환 중 오류가 발생했습니다.'));
              return;
            }
            resolve(blob);
          },
          file.type,
          0.8
        );
      };

      img.onerror = () => {
        reject(new Error('이미지 로드 중 오류가 발생했습니다.'));
      };
    });
  }
}
