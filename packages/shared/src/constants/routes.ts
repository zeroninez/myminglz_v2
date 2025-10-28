// 라우트 상수 정의
export const ROUTES = {
  // 웹 앱 라우트
  WEB: {
    HOME: '/',
    COUPON: {
      DETAIL: '/coupon/:id',
      SNS_UPLOAD: '/coupon/:id/sns',
      ISSUE: '/coupon/:id/issue',
      USE: '/coupon/:id/use'
    },
    STORE: {
      DETAIL: '/store/:id'
    }
  },

  // 관리자 앱 라우트
  ADMIN: {
    DASHBOARD: '/admin',
    STORES: '/admin/stores',
    STORE_DETAIL: '/admin/stores/:id',
    COUPONS: '/admin/coupons',
    COUPON_DETAIL: '/admin/coupons/:id',
    STATS: '/admin/stats'
  },

  // POS 앱 라우트
  POS: {
    LOGIN: '/pos/login',
    VALIDATE: '/pos/validate',
    HISTORY: '/pos/history'
  }
} as const;

// 동적 라우트 생성 헬퍼
export const createRoute = {
  couponDetail: (id: string) => ROUTES.WEB.COUPON.DETAIL.replace(':id', id),
  couponSnsUpload: (id: string) => ROUTES.WEB.COUPON.SNS_UPLOAD.replace(':id', id),
  couponIssue: (id: string) => ROUTES.WEB.COUPON.ISSUE.replace(':id', id),
  couponUse: (id: string) => ROUTES.WEB.COUPON.USE.replace(':id', id),
  storeDetail: (id: string) => ROUTES.WEB.STORE.DETAIL.replace(':id', id),
  adminStoreDetail: (id: string) => ROUTES.ADMIN.STORE_DETAIL.replace(':id', id),
  adminCouponDetail: (id: string) => ROUTES.ADMIN.COUPON_DETAIL.replace(':id', id)
};
