export interface UIState {
  // 모달 상태
  activeModal: string | null;
  modalData: any;

  // 토스트 메시지
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
  }>;

  // 로딩 상태
  loadingStates: Record<string, boolean>;

  // 액션
  showModal: (modalId: string, data?: any) => void;
  hideModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  removeToast: (id: string) => void;
  setLoading: (key: string, loading: boolean) => void;
}
