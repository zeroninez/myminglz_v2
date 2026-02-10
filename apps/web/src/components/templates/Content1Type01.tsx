interface Content1Type01Props {
  data: Record<string, string>;
}

export default function Content1Type01({ data }: Content1Type01Props) {
  const {
    label = '',
    titlePrimary = '',
    subtitle = '',
    body1 = '',
    imageUrl = '',
    backgroundColor = '#000000', // 전역 배경색 (검은색 기본값)
    containerBackgroundColor = '#0099FF', // 컨테이너 배경색
    labelColor = '#FFFFFF',
    titlePrimaryColor = '#FFFFFF',
    subtitleColor = '#D1D5DB',
    body1Color = '#E5E7EB',
    labelVisible,
    titlePrimaryVisible,
    subtitleVisible,
    body1Visible,
    imageUrlVisible,
  } = data;

  const isLabelVisible = labelVisible !== 'false';
  const isTitlePrimaryVisible = titlePrimaryVisible !== 'false';
  const isSubtitleVisible = subtitleVisible !== 'false';
  const isBody1Visible = body1Visible !== 'false';
  const isImageVisible = imageUrlVisible !== 'false';

  return (
    <div 
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor }}
    >
      <div className="flex h-full flex-col mt-6 mb-3 px-3">
        {/* 라운드된 콘텐츠 박스 */}
        <div 
          className="flex-1 rounded-2xl p-4 flex flex-col mx-0"
          style={{ backgroundColor: containerBackgroundColor }}
        >
          {/* 서브타이틀 + 번호 영역 */}
          <div className="flex justify-between items-start mb-4">
            {/* 서브타이틀 영역 */}
            <div 
              className="text-[16px] font-bold text-left"
              style={{ 
                color: subtitleColor,
                visibility: isSubtitleVisible && subtitle ? 'visible' : 'hidden'
              }}
            >
              {subtitle || '\u00A0'}
            </div>

            {/* 번호 영역 */}
            <div 
              className="text-[14px] font-medium text-right"
              style={{ 
                color: labelColor,
                visibility: isLabelVisible && label ? 'visible' : 'hidden'
              }}
            >
              {label || '\u00A0'}
            </div>
          </div>

          {/* 타이틀 영역 */}
          <div 
            className="text-[20px] font-bold mb-6 leading-tight text-left"
            style={{ 
              color: titlePrimaryColor,
              visibility: isTitlePrimaryVisible && titlePrimary ? 'visible' : 'hidden',
              minHeight: '2rem'
            }}
          >
            {titlePrimary || '\u00A0'}
          </div>

          {/* 본문 영역 */}
          <div 
            className="text-[12px] leading-relaxed flex-1 text-left"
            style={{ 
              color: body1Color,
              visibility: isBody1Visible && body1 ? 'visible' : 'hidden',
              minHeight: '1rem'
            }}
          >
            {body1 ? body1.split('\n').map((line, index) => (
              <div key={index} className="mb-2">
                {line}
              </div>
            )) : '\u00A0'}
          </div>
        </div>
      </div>
    </div>
  );
}