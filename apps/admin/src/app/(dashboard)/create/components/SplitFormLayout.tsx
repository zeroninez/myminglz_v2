import { ReactNode } from 'react';

interface InfoBoxProps {
  stepNumber: number;
  title: string | ReactNode;
  description: string[];
}

interface SplitFormLayoutProps {
  infoBox?: InfoBoxProps;
  leftContent: ReactNode;
  rightContent: ReactNode;
  scrollHeight?: string;
  className?: string;
}

export default function SplitFormLayout({
  infoBox,
  leftContent,
  rightContent,
  scrollHeight,
  className = '',
}: SplitFormLayoutProps) {
  return (
    <div className={`grid md:grid-cols-2 items-start ${className}`} style={{ height: '100%', minHeight: 0 }}>
      {/* 좌측: 입력 폼 */}
      <div 
        className="pr-6 pt-6 pb-12 overflow-y-auto custom-scrollbar"
        style={{ maxHeight: '100%', minHeight: 0 }}
      >
        {/* 정보 박스 */}
        {infoBox && (
          <div className="mb-8 rounded-sm border-0 bg-blue-50 p-4">
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center">
                    <span className="text-white text-[10px] font-semibold">{infoBox.stepNumber}</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-[#32373D] text-left flex-1">
                  {infoBox.title}
                </div>
              </div>
              {infoBox.description.map((desc, index) => (
                <p key={index} className="text-sm text-[#888888] text-left">
                  {desc}
                </p>
              ))}
            </div>
          </div>
        )}
        
        {leftContent}
      </div>

      {/* 우측: 미리보기 */}
      <div 
        className="pl-6 pb-12 overflow-y-auto custom-scrollbar"
        style={{ maxHeight: '100%', minHeight: 0 }}
      >
        <div className={infoBox ? 'pt-[22px]' : 'pt-6'}>
          {rightContent}
        </div>
      </div>
    </div>
  );
}
