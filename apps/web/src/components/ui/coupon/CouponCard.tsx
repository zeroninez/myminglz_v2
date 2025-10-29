'use client';

interface CouponCardProps {
  code: string;
  createdAt: string;
  expiryDays?: number | null;
  isUsed?: boolean;
}

export function CouponCard({ code, createdAt, expiryDays, isUsed }: CouponCardProps) {
  const getExpiryDate = () => {
    if (!expiryDays) return '기간 제한 없음';
    const expiryDate = new Date(new Date(createdAt).getTime() + (expiryDays * 24 * 60 * 60 * 1000));
    return `${expiryDate.toLocaleDateString('ko-KR')}까지 사용 가능`;
  };

  return (
    <div className="w-full max-w-[343px] bg-white border-2 border-gray-200 rounded-[20px] shadow-lg relative">
      {/* 쿠폰 내용 */}
      <div className="pt-6 pb-6 px-6">
        <div className="text-center mb-6">
          <h2 className="text-gray-700 text-[20px] font-bold tracking-wider mb-4">
            EVENT BENEFIT
          </h2>
          <p className="text-gray-900 text-[32px] font-bold mb-3 tracking-tight">
            {code}
          </p>
          <p className="text-gray-500 text-[14px]">
            {getExpiryDate()}
          </p>
          {isUsed && (
            <p className="text-red-500 text-[14px] font-bold mt-2">
              이미 사용된 쿠폰입니다
            </p>
          )}
        </div>

        {/* 점선 구분선 */}
        <div className="border-t-2 border-dashed border-gray-200 my-4" />

        {/* 하단 텍스트 */}
        <p className="text-center text-gray-600 text-[15px] font-medium">
          이벤트 쿠폰
        </p>
      </div>
    </div>
  );
}

