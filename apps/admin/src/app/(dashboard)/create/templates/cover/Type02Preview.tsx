import PhoneFrame from '../components/PhoneFrame';
import { useRef, useEffect, useState } from 'react';

interface CoverType02PreviewProps {
  data: Record<string, string>;
}

export default function CoverType02Preview({ data }: CoverType02PreviewProps) {
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

  const labelTextRef = useRef<HTMLSpanElement>(null);
  const [labelWidth, setLabelWidth] = useState(0);

  useEffect(() => {
    if (labelTextRef.current) {
      setLabelWidth(labelTextRef.current.offsetWidth);
    }
  }, [label]);

  return (
    <PhoneFrame 
      innerBackgroundColor={backgroundColor}
      statusBarPadding={true}
      noPadding={true}
    >
      <div className="relative flex h-full flex-col">
        {/* 상단 50%: 텍스트 영역 (status bar 포함 전체의 50%) */}
        <div 
          className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center justify-start text-center px-6 overflow-hidden" 
          style={{ 
            height: '235px', // PhoneFrame 전체 높이(470px)의 50%
            paddingTop: '16px', // status bar 아래 여백 줄임
            maxHeight: '235px', // 최대 높이 제한
          }}
        >
          <div
            className="relative inline-flex flex-col items-center justify-center text-[11px] font-medium uppercase tracking-wide"
            style={{
              color: labelColor,
              visibility: isLabelVisible && label ? 'visible' : 'hidden',
              width: labelWidth > 0 ? `${labelWidth + 16}px` : 'auto',
            }}
          >
            {/* 상단 선 */}
            <div
              className="absolute top-0 h-[1px]"
              style={{ backgroundColor: labelColor, width: `${labelWidth + 16}px` }}
            />
            {/* 라벨 텍스트 */}
            <span ref={labelTextRef} className="relative px-2 py-1">
              {label || '\u00A0'}
            </span>
            {/* 하단 선 */}
            <div
              className="absolute bottom-0 h-[1px]"
              style={{ backgroundColor: labelColor, width: `${labelWidth + 16}px` }}
            />
          </div>

          <div
            className="mt-2 text-center text-[26px] font-bold leading-tight tracking-tight"
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

          <div className="mt-1 flex flex-col gap-0.5 text-center text-[11px]">
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

        {/* 하단 50%: 이미지 영역 (status bar 포함 전체의 50%) */}
        <div 
          className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden"
          style={{ 
            height: '235px', // PhoneFrame 전체 높이(470px)의 50%
            backgroundColor: backgroundColor 
          }}
        >
          {isImageVisible && imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                // 이미지 로드 실패 시 빈 영역 표시
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            // 이미지 off 시 배경색으로 표시
            <div className="h-full w-full" style={{ backgroundColor: backgroundColor }} />
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

