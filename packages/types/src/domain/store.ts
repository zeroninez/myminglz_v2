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

export interface StoreConfig {
  id: string;
  storeId: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
  features: {
    enableInstantUse: boolean;
    enableLaterUse: boolean;
    requireSNSAuth: boolean;
  };
  updatedAt: string;
}