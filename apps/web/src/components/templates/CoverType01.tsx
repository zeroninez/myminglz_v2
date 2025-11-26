interface CoverType01Props {
  data: Record<string, string>;
}

export default function CoverType01({ data }: CoverType01Props) {
  const {
    label = '',
    titlePrimary = '',
    titleSecondary = '',
    subtitle = '',
    body1 = '',
    body2 = '',
    body3 = '',
    imageUrl = '',
    backgroundColor = '#000000',
    labelColor = '#FFFFFF',
    titlePrimaryColor = '#FFFFFF',
    titleSecondaryColor = '#FFFFFF',
    subtitleColor = '#D1D5DB',
    body1Color = '#E5E7EB',
    body2Color = '#E5E7EB',
    body3Color = '#E5E7EB',
    labelVisible,
    titlePrimaryVisible,
    titleSecondaryVisible,
    subtitleVisible,
    body1Visible,
    body2Visible,
    body3Visible,
    imageUrlVisible,
  } = data;

  const isLabelVisible = labelVisible !== 'false';
  const isTitlePrimaryVisible = titlePrimaryVisible !== 'false';
  const isTitleSecondaryVisible = titleSecondaryVisible !== 'false';
  const isSubtitleVisible = subtitleVisible !== 'false';
  const isBody1Visible = body1Visible !== 'false';
  const isBody2Visible = body2Visible !== 'false';
  const isBody3Visible = body3Visible !== 'false';
  const isImageVisible = imageUrlVisible !== 'false';

  return (
    <div 
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ 
        backgroundColor,
        ...(isImageVisible && imageUrl ? {
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        } : {}),
      }}
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
            }}
          >
            {label || '\u00A0'}
          </div>

          <div
            className="mt-7 text-center text-[26px] font-bold leading-tight tracking-tight"
            style={{ color: titlePrimaryColor, visibility: isTitlePrimaryVisible ? 'visible' : 'hidden', minHeight: '2rem' }}
          >
            {titlePrimary || '\u00A0'}
            {titleSecondary && (
              <>
                <br />
                <span
                  style={{ color: titleSecondaryColor, visibility: isTitleSecondaryVisible ? 'visible' : 'hidden' }}
                >
                  {titleSecondary}
                </span>
              </>
            )}
          </div>

          <div
            className="mt-2 text-center text-[12px]"
            style={{ color: subtitleColor, visibility: isSubtitleVisible && subtitle ? 'visible' : 'hidden', minHeight: '1rem' }}
          >
            {subtitle || '\u00A0'}
          </div>

          <div className="mt-40 flex flex-col gap-2 text-center text-[11px]">
            <div style={{ color: body1Color, visibility: isBody1Visible && body1 ? 'visible' : 'hidden', minHeight: '1rem' }}>
              {body1 || '\u00A0'}
            </div>
            <div style={{ color: body2Color, visibility: isBody2Visible && body2 ? 'visible' : 'hidden', minHeight: '1rem' }}>
              {body2 || '\u00A0'}
            </div>
            <div style={{ color: body3Color, visibility: isBody3Visible && body3 ? 'visible' : 'hidden', minHeight: '1rem' }}>
              {body3 || '\u00A0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
