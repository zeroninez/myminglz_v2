'use client';

import { forwardRef } from 'react';

interface CouponDesignProps {
  couponCode: string;
  storeName?: string;
  expireDate?: string;
  logoUrl?: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  titleText?: string;
  qrUrl?: string | null;
}

export const CouponDesign = forwardRef<HTMLDivElement, CouponDesignProps>(
  ({ 
    couponCode, 
    storeName = '테스트 스토어', 
    expireDate, 
    logoUrl,
    description,
    backgroundColor = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    textColor = 'white',
    titleText = 'SPECIAL COUPON',
    qrUrl
  }, ref) => {

    return (
      <div
        ref={ref}
        className="w-full min-h-[400px] bg-white rounded-xl p-8 relative shadow-xl overflow-hidden"
        style={{ backgroundImage: backgroundColor }}
      >
        <div className="flex flex-col space-y-6 relative z-10 h-full">
          <div className="flex justify-between items-start">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="브랜드 로고"
                className="w-20 h-20 object-contain"
              />
            )}
            <p
              className="text-2xl font-bold"
              style={{ 
                color: textColor,
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              {storeName}
            </p>
          </div>

          <div className="flex justify-between items-center flex-1 gap-8">
            <div className="flex flex-col space-y-4 flex-1">
              <p
                className="text-5xl font-black text-center whitespace-pre-wrap break-words leading-tight tracking-wide"
                style={{ 
                  color: textColor,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {titleText}
              </p>
              <p
                className="text-3xl font-bold"
                style={{ 
                  color: textColor,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                {couponCode}
              </p>
              {description && (
                <p
                  className="text-lg text-center whitespace-pre-wrap"
                  style={{ 
                    color: textColor,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  {description}
                </p>
              )}
            </div>

            {qrUrl && (
              <div className="bg-white p-4 rounded-lg shadow-lg w-[150px] h-[150px] flex-shrink-0">
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between w-full">
            <p
              className="text-sm"
              style={{ color: textColor }}
            >
              {expireDate ? `유효기간: ${expireDate}` : '발급일로부터 7일간 유효'}
            </p>
            <p
              className="text-sm"
              style={{ color: textColor }}
            >
              * 본 쿠폰은 1회만 사용 가능합니다.
            </p>
          </div>
        </div>

        {/* 절취선 */}
        <div
          className="absolute left-[-20px] top-1/2 w-[10px] h-[40px] bg-gray-100 rounded-full"
          style={{ transform: 'translateY(-50%)' }}
        />
        <div
          className="absolute right-[-20px] top-1/2 w-[10px] h-[40px] bg-gray-100 rounded-full"
          style={{ transform: 'translateY(-50%)' }}
        />
      </div>
    );
  }
);