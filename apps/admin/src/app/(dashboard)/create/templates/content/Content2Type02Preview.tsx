import PhoneFrame from '../components/PhoneFrame';

interface Content2Type02PreviewProps {
  data: Record<string, string>;
}

export default function Content2Type02Preview({ data }: Content2Type02PreviewProps) {
  const {
    subtitle = '',
    label = '',
    titlePrimary = '',
    body1 = '',
    imageUrl = '',
    backgroundColor = '#0099FF', // 전체 배경색 기본값
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

  return (
    <PhoneFrame 
      innerBackgroundColor={backgroundColor}
      statusBarPadding={true}
    >
      <div className="flex h-full flex-col mt-3 px-6">
        {/* 서브타이틀 + 번호 영역 */}
        <div className="flex flex-col mb-4">
          {/* 번호 영역 (우측 정렬) */}
          {isLabelVisible && (
            <div 
              className="text-right text-[14px] font-medium mb-2"
              style={{ 
                color: labelColor,
                visibility: label ? 'visible' : 'hidden',
                minHeight: '1.5rem'
              }}
            >
              {label || '\u00A0'}
            </div>
          )}
          
          {/* 서브타이틀 영역 (좌측 정렬) */}
          {isSubtitleVisible && (
            <div 
              className="text-left text-[16px] font-bold"
              style={{ 
                color: subtitleColor,
                visibility: subtitle ? 'visible' : 'hidden',
                minHeight: '1.5rem'
              }}
            >
              {subtitle || '\u00A0'}
            </div>
          )}
        </div>

        {/* 타이틀 영역 */}
        {isTitlePrimaryVisible && (
          <div 
            className="text-[26px] font-bold leading-tight tracking-tight mb-4 text-left"
            style={{ 
              color: titlePrimaryColor,
              visibility: titlePrimary ? 'visible' : 'hidden',
              minHeight: '2rem'
            }}
          >
            {titlePrimary || '\u00A0'}
          </div>
        )}

        {/* 본문 영역*/}
        {isBody1Visible && (
          <div 
            className="text-[11px] leading-normal mb-6 text-left h-32"
            style={{ 
              color: body1Color,
              visibility: body1 ? 'visible' : 'hidden',
              minHeight: '1rem'
            }}
          >
            {body1 ? body1.split('\n').map((line, index) => (
              <div key={index} className="mb-1">
                {line || '\u00A0'}
              </div>
            )) : '\u00A0'}
          </div>
        )}

        {/* 하단 이미지 영역 (직각) - 크기는 그대로, 위치만 위로 */}
        <div className="h-32 mb-3">
          {isImageVisible && imageUrl ? (
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
      </div>
    </PhoneFrame>
  );
}