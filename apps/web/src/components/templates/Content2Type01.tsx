interface Content2Type01Props {
  data: Record<string, string>;
}

export default function Content2Type01({ data }: Content2Type01Props) {
  const {
    subtitle = '',
    label = '',
    titlePrimary = '',
    body1 = '',
    imageUrl = '',
    backgroundColor = '#000000', // 전역 배경색 (검은색 기본값)
    containerBackgroundColor = '#0099FF', // 컨테이너 배경색
    subtitleColor = '#FFFFFF',
    labelColor = '#D1D5DB',
    titlePrimaryColor = '#FFFFFF',
    body1Color = '#E5E7EB',
    subtitleVisible,
    labelVisible,
    titlePrimaryVisible,
    body1Visible,
    imageUrlVisible,
  } = data;

  const isSubtitleVisible = subtitleVisible !== 'false';
  const isLabelVisible = labelVisible !== 'false';
  const isTitlePrimaryVisible = titlePrimaryVisible !== 'false';
  const isBody1Visible = body1Visible !== 'false';
  const isImageVisible = imageUrlVisible !== 'false';

  // blob URL은 로컬 미리보기용이므로 실제 배포에서는 사용하지 않음
  const isValidImageUrl = imageUrl && !imageUrl.startsWith('blob:');

  return (
    <div 
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor }}
    >
      <div className="flex h-full flex-col mt-6 mb-3 px-3">
        {/* 상단 이미지 영역 (정확히 50%) - 패딩 없이 꽉 차고 상단만 라운드 */}
        <div className="h-1/2 overflow-hidden rounded-t-2xl">
          {isImageVisible && isValidImageUrl ? (
            <img
              src={imageUrl}
              alt="콘텐츠 이미지"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">이미지 영역</span>
            </div>
          )}
        </div>

        {/* 하단 텍스트 영역 (정확히 50%) - 하단만 라운드, 컨테이너 배경색 적용 */}
        <div 
          className="h-1/2 rounded-b-2xl p-4 flex flex-col"
          style={{ backgroundColor: containerBackgroundColor }}
        >
          {/* 서브타이틀 + 번호 영역 */}
          <div className="flex justify-between items-start mb-4">
            {/* 서브타이틀 영역 */}
            {isSubtitleVisible && (
              <div 
                className="text-[16px] font-bold text-left"
                style={{ 
                  color: subtitleColor,
                  visibility: subtitle ? 'visible' : 'hidden',
                  minHeight: '1.5rem'
                }}
              >
                {subtitle || '\u00A0'}
              </div>
            )}

            {/* 번호 영역 */}
            {isLabelVisible && (
              <div 
                className="text-[14px] font-medium text-right"
                style={{ 
                  color: labelColor,
                  visibility: label ? 'visible' : 'hidden',
                  minHeight: '1.5rem'
                }}
              >
                {label || '\u00A0'}
              </div>
            )}
          </div>

          {/* 타이틀 영역 */}
          {isTitlePrimaryVisible && (
            <div 
              className="text-[20px] font-bold mb-6 leading-tight text-left"
              style={{ 
                color: titlePrimaryColor,
                visibility: titlePrimary ? 'visible' : 'hidden',
                minHeight: '2rem'
              }}
            >
              {titlePrimary || '\u00A0'}
            </div>
          )}

          {/* 본문 영역 */}
          {isBody1Visible && (
            <div 
              className="text-[12px] leading-relaxed flex-1 text-left"
              style={{ 
                color: body1Color,
                visibility: body1 ? 'visible' : 'hidden',
                minHeight: '1rem'
              }}
            >
              {body1 ? body1.split('\n').map((line, index) => (
                <div key={index} className="mb-2">
                  {line}
                </div>
              )) : '\u00A0'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}