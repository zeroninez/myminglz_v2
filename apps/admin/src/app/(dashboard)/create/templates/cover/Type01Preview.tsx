import PhoneFrame from '../components/PhoneFrame';

interface CoverType01PreviewProps {
  data: Record<string, string>;
}

export default function CoverType01Preview({ data }: CoverType01PreviewProps) {
  const {
    label = '',
    titlePrimary = '',
    subtitle = '',
    body1 = '',
    imageUrl = '',
    backgroundColor = '#000000',
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
      innerBackgroundImage={isImageVisible && imageUrl ? imageUrl : undefined}
      statusBarPadding={true}
    >
      <div className="relative flex h-full flex-col items-center justify-center">
        {/* 텍스트 컨텐츠 - 이미지 위에 표시 */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center">
          <div
            className="relative inline-flex flex-col items-center justify-center text-[11px] font-medium uppercase tracking-wide"
            style={{ 
              color: labelColor, 
              visibility: isLabelVisible && label ? 'visible' : 'hidden',
              borderTop: `1px solid ${labelColor}`,
              borderBottom: `1px solid ${labelColor}`,
              paddingTop: '0.25rem',
              paddingBottom: '0.25rem',
              paddingLeft: '0',
              paddingRight: '0',
              whiteSpace: 'pre-line',
            }}
      >
        {label || '\u00A0'}
      </div>

      <div
            className="mt-7 text-center text-[26px] font-bold leading-tight tracking-tight"
        style={{ color: titlePrimaryColor, visibility: isTitlePrimaryVisible ? 'visible' : 'hidden', minHeight: '2rem', whiteSpace: 'pre-line' }}
      >
        {titlePrimary || '\u00A0'}
      </div>

      <div
            className="mt-2 text-center text-[12px]"
        style={{ color: subtitleColor, visibility: isSubtitleVisible && subtitle ? 'visible' : 'hidden', minHeight: '1rem', whiteSpace: 'pre-line' }}
      >
        {subtitle || '\u00A0'}
      </div>

          <div className="mt-40 text-center text-[11px]">
        <div style={{ color: body1Color, visibility: isBody1Visible && body1 ? 'visible' : 'hidden', minHeight: '1rem', whiteSpace: 'pre-line' }}>
          {body1 || '\u00A0'}
        </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

