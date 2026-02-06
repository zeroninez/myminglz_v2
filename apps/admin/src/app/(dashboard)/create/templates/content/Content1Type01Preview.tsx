import PhoneFrame from '../components/PhoneFrame';

interface Content1Type01PreviewProps {
  data: Record<string, string>;
}

export default function Content1Type01Preview({ data }: Content1Type01PreviewProps) {
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
    <PhoneFrame 
      innerBackgroundColor={backgroundColor}
      noPadding={true}
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
            {isSubtitleVisible && (
              <div 
                className="text-[16px] font-bold text-left"
                style={{ color: subtitleColor }}
              >
                {subtitle}
              </div>
            )}

            {/* 번호 영역 */}
            {isLabelVisible && (
              <div 
                className="text-[14px] font-medium text-right"
                style={{ color: labelColor }}
              >
                {label}
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
      </div>
    </PhoneFrame>
  );
}