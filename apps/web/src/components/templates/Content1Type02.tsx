import PhoneFrame from './PhoneFrame';

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
    <PhoneFrame 
      innerBackgroundColor={backgroundColor}
      noPadding={true}
    >
      <div className="flex h-full flex-col mt-3 px-6">
        {/* 번호 + 서브타이틀 영역 (세로 배치) */}
        <div className="flex flex-col mb-4">
          {/* 번호 영역 */}
          {isLabelVisible && (
            <div 
              className="text-[14px] font-medium text-right mb-1 self-end"
              style={{ color: labelColor }}
            >
              {label}
            </div>
          )}

          {/* 서브타이틀 영역 */}
          {isSubtitleVisible && (
            <div 
              className="text-[16px] font-bold text-left self-start"
              style={{ color: subtitleColor }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* 타이틀 영역 */}
        {isTitlePrimaryVisible && (
          <div 
            className="text-[20px] font-bold mb-6 leading-tight text-left"
            style={{ color: titlePrimaryColor }}
          >
            {titlePrimary}
          </div>
        )}

        {/* 본문 영역 */}
        {isBody1Visible && (
          <div 
            className="text-[12px] leading-relaxed flex-1 text-left"
            style={{ color: body1Color }}
          >
            {body1 && body1.split('\n').map((line, index) => (
              <div key={index} className="mb-2">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}