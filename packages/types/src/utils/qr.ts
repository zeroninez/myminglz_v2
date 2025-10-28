export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export interface QRData {
  type: string;
  storeId: string;
  timestamp: number;
}