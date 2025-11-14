import { ReactNode } from 'react';

interface PhoneFrameProps {
  children: ReactNode;
  outerBorderColor?: string;
  outerBackgroundColor?: string;
  innerBorderColor?: string;
  innerBackgroundColor?: string;
  showStatusBar?: boolean;
  timeText?: string;
  statusIndicator?: ReactNode;
  contentClassName?: string;
}

export default function PhoneFrame({
  children,
  outerBorderColor = '#949494',
  outerBackgroundColor = '#949494',
  innerBorderColor = '#949494',
  innerBackgroundColor = '#000000',
  showStatusBar = true,
  timeText = '9:41',
  statusIndicator = <span>●●●</span>,
  contentClassName = 'text-white',
}: PhoneFrameProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-[30px] border p-1"
        style={{ borderColor: outerBorderColor, backgroundColor: outerBackgroundColor }}
      >
        <div
          className={`relative flex h-[470px] w-[232px] flex-col rounded-[28px] border px-6 py-7 ${contentClassName}`}
          style={{ borderColor: innerBorderColor, backgroundColor: innerBackgroundColor }}
        >
          {showStatusBar && (
            <div className="flex items-center justify-between text-[10px] text-gray-300">
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



