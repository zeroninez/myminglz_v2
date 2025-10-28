import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StaffState } from './types';

const initialState = {
  isAuthenticated: false,
  staffCode: null,
  storeId: null,
  isLoading: false,
  error: null
};

export const useStaffStore = create<StaffState>()(
  devtools(
    (set, get) => ({
      // 상태
      ...initialState,

      // 액션
      setStaffCode: (code) => set({ staffCode: code }),
      setStoreId: (id) => set({ storeId: id }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // 비즈니스 로직
      authenticate: async (code) => {
        const { setLoading, setError, setStaffCode, setStoreId } = get();
        try {
          setLoading(true);
          setError(null);

          const response = await window.fetch('/api/staff/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });

          const result = await response.json();
          if (!result.success) throw new Error(result.error);

          setStaffCode(code);
          setStoreId(result.data.storeId);
          set({ isAuthenticated: true });
        } catch (error) {
          setError(error instanceof Error ? error.message : '인증 실패');
          set({ isAuthenticated: false });
        } finally {
          setLoading(false);
        }
      },

      logout: () => {
        set(initialState);
      }
    })
  )
);
