import PhoneFrame from '../components/PhoneFrame';

interface CoverType01PreviewProps {
  data: Record<string, string>;
}

export default function CoverType01Preview({ data }: CoverType01PreviewProps) {
  const {
    label = '',
    titlePrimary = '',
    titleSecondary = '',
    subtitle = '',
    body1 = '',
    body2 = '',
    body3 = '',
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
  } = data;

  const isLabelVisible = labelVisible !== 'false';
  const isTitlePrimaryVisible = titlePrimaryVisible !== 'false';
  const isTitleSecondaryVisible = titleSecondaryVisible !== 'false';
  const isSubtitleVisible = subtitleVisible !== 'false';
  const isBody1Visible = body1Visible !== 'false';
  const isBody2Visible = body2Visible !== 'false';
  const isBody3Visible = body3Visible !== 'false';

  return (
    <PhoneFrame innerBackgroundColor={backgroundColor}>
      <div
        className="mt-8 inline-flex items-center justify-center rounded-full border border-white/80 px-4 py-1 text-[11px] font-medium uppercase tracking-wide"
        style={{ color: labelColor, visibility: isLabelVisible && label ? 'visible' : 'hidden' }}
      >
        {label || '\u00A0'}
      </div>

      <div
        className="mt-7 text-[26px] font-bold leading-tight tracking-tight"
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
        className="mt-3 text-[12px]"
        style={{ color: subtitleColor, visibility: isSubtitleVisible && subtitle ? 'visible' : 'hidden', minHeight: '1rem' }}
      >
        {subtitle || '\u00A0'}
      </div>

      <div className="mt-auto flex flex-col gap-2 text-[11px]">
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
    </PhoneFrame>
  );
}

