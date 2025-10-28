export interface ImageUploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

export interface ImageDeleteResult {
  success: boolean;
  error?: string;
}

export interface ImageListResult {
  success: boolean;
  files?: any[];
  error?: string;
}