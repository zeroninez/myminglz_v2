import { useRouter } from 'next/navigation';
import { useCouponStorage } from '@/hooks/useCouponStorage';

export const useCouponFlow = () => {
  const router = useRouter();
  const { saveToLocal, saveToSession } = useCouponStorage();

  const handleIssue = (options: { 
    immediateUse: boolean;
    code: string;
    storeId: string;
  }) => {
    if (options.immediateUse) {
      // 즉시 사용 플로우
      saveToSession('tempCouponCode', options.code);
      router.push(`/store/${options.storeId}/coupon/validate`);
    } else {
      // 보관 플로우
      saveToLocal('couponCode', options.code);
      router.push(`/store/${options.storeId}/coupon/success`);
    }
  };

  return { handleIssue };
};
