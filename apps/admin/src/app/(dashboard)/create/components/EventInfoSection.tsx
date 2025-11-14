interface EventInfoSectionProps {
  onDataChange?: (data: {
    name?: string;
    domain_code?: string;
    start_date?: string;
    end_date?: string;
    background_color?: string;
    description?: string;
    content_html?: string;
    coupon_preview_image_url?: string;
    event_info_config?: any;
  }) => void;
}

export default function EventInfoSection({ onDataChange }: EventInfoSectionProps) {
  return (
    <section className="grid gap-4 md:grid-cols-[360px_1fr]">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">이벤트 쿠폰 미리보기</h3>
        <p className="mt-2 text-sm text-gray-500">
          발급될 쿠폰 정보와 디자인 미리보기 영역입니다.
        </p>
        <div className="mt-4 h-64 rounded-xl border border-dashed border-gray-300 bg-gray-50"></div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">이벤트 정보</h3>
        <p className="mt-2 text-sm text-gray-500">
          이벤트 이름, 기간, 도메인 주소와 함께 쿠폰 사용처를 등록합니다.
        </p>

        <div className="mt-6 space-y-8">
          <div>
            <h4 className="text-sm font-semibold text-gray-800">1. 기본 정보</h4>
            <p className="mt-1 text-xs text-gray-500">
              이벤트 제목, 이벤트 기간, 도메인 주소 등을 입력합니다.
            </p>
            <div className="mt-3 grid gap-3">
              <div className="h-12 rounded-lg border border-dashed border-gray-300 bg-gray-50"></div>
              <div className="h-12 rounded-lg border border-dashed border-gray-300 bg-gray-50"></div>
              <div className="h-12 rounded-lg border border-dashed border-gray-300 bg-gray-50"></div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800">2. 사용처 등록</h4>
            <p className="mt-1 text-xs text-gray-500">
              쿠폰 사용이 가능한 매장/지점 정보를 등록합니다.
            </p>
            <div className="mt-3 grid gap-3">
              <div className="h-12 rounded-lg border border-dashed border-gray-300 bg-gray-50"></div>
              <div className="h-24 rounded-lg border border-dashed border-gray-300 bg-gray-50"></div>
              <div className="flex justify-end">
                <div className="h-10 w-32 rounded-lg border border-dashed border-blue-300 bg-blue-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

