export interface ShareData {
  title: string;
  text: string;
  url: string;
  imageUrl?: string;
}

export interface ShareResult {
  success: boolean;
  platform?: 'kakao' | 'instagram' | 'facebook' | 'native' | 'twitter';
  error?: string;
}

