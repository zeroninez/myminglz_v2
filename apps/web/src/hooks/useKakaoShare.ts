import { CouponService } from '@myminglz/core';

interface ShareKakaoParams {
  title: string;
  description: string;
  imageUrl: string;
  buttonTitle?: string;
  couponCode: string;
}

export const useKakaoShare = () => {
  const shareCoupon = async (couponCode: string, storeSlug?: string) => {
    // 쿠폰 데이터 조회
    const result = await CouponService.getCouponByCode(couponCode);
    const locationName = result.data?.location?.name || '매장';

    const params = {
      title: '쿠폰을 사용해보세요',
      description: `${locationName}에서 쿠폰을 발급받았어요\n${locationName}에서 쿠폰을 사용해보세요`,
      imageUrl: 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png',
      buttonTitle: '쿠폰 사용하기',
    };

    if (!window.Kakao) {
      console.error('Kakao SDK not found');
      return;
    }

    const domain = process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_DOMAIN || window.location.origin;
    // location slug (domain_code)만 사용 (여러 사용처 중 어디서 사용할지는 QR 코드로 확인)
    const locationSlug = result.data?.location?.slug || storeSlug || 'default';
    const shareUrl = `${domain}/store/${locationSlug}/coupon/${couponCode}/use`;
    
    console.log('🔗 카카오톡 공유 URL:', shareUrl);

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: params.title,
        description: params.description,
        imageUrl: params.imageUrl,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: params.buttonTitle,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    });
  };

  return { shareCoupon };
};
