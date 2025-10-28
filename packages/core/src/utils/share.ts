import { ShareData, ShareResult } from '@myminglz/types';

export class ShareService {
  /**
   * 네이티브 공유 API 사용
   */
  static async shareNative(data: ShareData): Promise<ShareResult> {
    try {
      if (!navigator.share) {
        throw new Error('공유 API를 지원하지 않는 브라우저입니다.');
      }

      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });

      return {
        success: true,
        platform: 'native',
      };
    } catch (error) {
      console.error('공유 오류:', error);
      return {
        success: false,
        platform: 'native',
        error: '공유 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 인스타그램 스토리 공유
   */
  static async shareToInstagramStory(data: ShareData): Promise<ShareResult> {
    try {
      if (!data.imageUrl) {
        throw new Error('이미지 URL이 필요합니다.');
      }

      // 인스타그램 스토리 공유 URL 생성
      const url = \`instagram-stories://share?source_application=\${window.location.hostname}\`;
      
      // 이미지를 Blob으로 변환
      const response = await fetch(data.imageUrl);
      const blob = await response.blob();
      
      // 인스타그램 공유 데이터 생성
      const formData = new FormData();
      formData.append('image', blob);
      
      // 인스타그램 앱으로 이동
      window.location.href = url;

      return {
        success: true,
        platform: 'instagram',
      };
    } catch (error) {
      console.error('인스타그램 공유 오류:', error);
      return {
        success: false,
        platform: 'instagram',
        error: '인스타그램 공유 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 클립보드 복사
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (error) {
        textArea.remove();
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * 공유 가능 여부 확인
   */
  static canShare(data: ShareData): boolean {
    if (!navigator.share) return false;
    
    return navigator.canShare?.(data) ?? false;
  }
}
