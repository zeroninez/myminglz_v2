export interface StaffState {
  // 상태
  isAuthenticated: boolean;
  staffCode: string | null;
  storeId: string | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  setStaffCode: (code: string | null) => void;
  setStoreId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 비즈니스 로직
  authenticate: (code: string) => Promise<void>;
  logout: () => void;
}
