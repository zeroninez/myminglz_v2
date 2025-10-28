import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UIState } from './types';

const initialState = {
  activeModal: null,
  modalData: null,
  toasts: [],
  loadingStates: {}
};

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // 상태
      ...initialState,

      // 모달 관련 액션
      showModal: (modalId, data = null) => {
        set({
          activeModal: modalId,
          modalData: data
        });
      },

      hideModal: () => {
        set({
          activeModal: null,
          modalData: null
        });
      },

      // 토스트 관련 액션
      showToast: (message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
          toasts: [
            ...state.toasts,
            { id, message, type, duration }
          ]
        }));

        // 자동 제거
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }));
      },

      // 로딩 상태 관리
      setLoading: (key, loading) => {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading
          }
        }));
      }
    })
  )
);
