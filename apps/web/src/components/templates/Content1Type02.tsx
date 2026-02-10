interface Content1Type02Props {
  data: Record<string, string>;
}

export default function Content1Type02({ data }: Content1Type02Props) {
  const {
    label = '',
    titlePrimary = '',
    subtitle = '',
    body1 = '',
    imageUrl = '',
    backgroundColor = '#0099FF', // 전체 배경색
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
      <div className="flex h-full flex-col mt-3 px-6">
        {/* 번호 + 서브타이틀 영역 (세로 배치) */}
        <div className="flex flex-col mb-4">
          {/* 번호 영역 */}
          <div 
            className="text-[14px] font-medium text-right mb-1 self-end"
            style={{ 
              color: labelColor,
              visibility: isLabelVisible && label ? 'visible' : 'hidden'
            }}
          >
            {label || '\u00A0'}
          </div>

          {/* 서브타이틀 영역 */}
          <div 
            className="text-[16px] font-bold text-left self-start"
            style={{ 
              color: subtitleColor,
              visibility: isSubtitleVisible && subtitle ? 'visible' : 'hidden'
            }}
          >
            {subtitle || '\u00A0'}
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
  );
}