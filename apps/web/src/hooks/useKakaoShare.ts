import { CouponService } from '@myminglz/core';

interface ShareKakaoParams {
  title: string;
  description: string;
  imageUrl: string;
  buttonTitle?: string;
  couponCode: string;
}

export const useKakaoShare = () => {
  const shareCoupon = async (couponCode: string) => {
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

    const domain = process.env.NEXT_PUBLIC_DOMAIN || window.location.origin;
    const shareUrl = `${domain}/store/test/coupon/${couponCode}/use`;

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
