import { ReactNode, useMemo } from 'react';

interface PhoneFrameProps {
  children: ReactNode;
  outerBorderColor?: string;
  outerBackgroundColor?: string;
  innerBorderColor?: string;
  innerBackgroundColor?: string;
  innerBackgroundImage?: string;
  showStatusBar?: boolean;
  timeText?: string;
  statusIndicator?: ReactNode;
  contentClassName?: string;
  statusBarPadding?: boolean; // status bar에만 패딩을 적용할지 여부
  noPadding?: boolean; // 패딩을 완전히 제거하여 children이 전체 영역 사용 가능
}

// hex 색상의 밝기를 계산하는 함수
function getBrightness(hex: string): number {
  // # 제거
  const color = hex.replace('#', '');
  
  // RGB 추출
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // 상대적 휘도 계산 (0-255)
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export default function PhoneFrame({
  children,
  outerBorderColor = '#949494',
  outerBackgroundColor = '#949494',
  innerBorderColor = '#949494',
  innerBackgroundColor = '#000000',
  innerBackgroundImage,
  showStatusBar = true,
  timeText = '9:41',
  statusIndicator = <span>●●●</span>,
  contentClassName = 'text-white',
  statusBarPadding = false,
  noPadding = false,
}: PhoneFrameProps) {
  // 배경색의 밝기를 기반으로 텍스트 색상 결정
  const statusBarTextColor = useMemo(() => {
    const brightness = getBrightness(innerBackgroundColor);
    // 밝기가 128 이상이면 어두운 텍스트, 그렇지 않으면 밝은 텍스트
    return brightness >= 128 ? '#000000' : '#FFFFFF';
  }, [innerBackgroundColor]);

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-[30px] border p-1"
        style={{ borderColor: outerBorderColor, backgroundColor: outerBackgroundColor }}
      >
        <div
          className={`relative flex h-[470px] w-[232px] flex-col rounded-[28px] border ${noPadding || innerBackgroundImage || statusBarPadding ? '' : 'px-6 py-7'} overflow-hidden ${contentClassName}`}
          style={{ 
            borderColor: innerBorderColor, 
            backgroundColor: innerBackgroundColor,
            ...(innerBackgroundImage && {
              backgroundImage: `url(${innerBackgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }),
          }}
        >
          {showStatusBar && (
            <div 
              className={`flex items-center justify-between text-[10px] ${noPadding || innerBackgroundImage || statusBarPadding ? 'px-6 pt-3' : ''}`}
              style={{ color: statusBarTextColor }}
            >
              <span>{timeText}</span>
              <div className="flex items-center gap-1">{statusIndicator}</div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}



