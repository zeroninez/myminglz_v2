export interface Coupon {
  id: string;
  code: string;
  location_id: string;
  is_used: boolean;
  created_at: string;
  used_at?: string;
  validated_at?: string;
  validated_by_store_id?: string;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  location_id: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponWithDetails extends Coupon {
  location?: Location;
  store?: Store;
  validated_by_store?: Store;
}

export interface GenerateCodeResult {
  success: boolean;
  code?: string;
  location?: Location;
  error?: string;
}

export type SaveCodeResult = {
  success: true;
  coupon: CouponWithDetails;
  message: string;
} | {
  success: false;
  error: string;
}

export interface ValidateCodeResult {
  success: boolean;
  isValid?: boolean;
  isUsed?: boolean;
  location?: Location;
  store?: Store;
  message?: string;
  error?: string;
}

export interface LocationStats {
  location: Location;
  total: number;
  used: number;
  unused: number;
  usage_rate: number;
}

export interface StoreStats {
  store: Store;
  validated: number;
}