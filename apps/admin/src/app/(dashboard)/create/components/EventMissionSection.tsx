'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import PhoneFrame from '../templates/components/PhoneFrame';

interface EventMissionSectionProps {
  initialData?: { mission_config?: any };
  onDataChange?: (data: { mission_config?: any }) => void;
}

export interface EventMissionSectionRef {
  validate: () => { isValid: boolean; error?: string };
  isValid: () => boolean;
}

const EventMissionSection = forwardRef<EventMissionSectionRef, EventMissionSectionProps>(
  ({ initialData, onDataChange }, ref) => {
  const [selectedMissionType, setSelectedMissionType] = useState<string>('sns');
  const [hashtags, setHashtags] = useState<string[]>(['']);

  // initialData가 있으면 상태 초기화
  useEffect(() => {
    if (initialData?.mission_config) {
      const config = initialData.mission_config;
      if (config.type) {
        setSelectedMissionType(config.type);
      }
      if (config.hashtags && config.hashtags.length > 0) {
        setHashtags(config.hashtags);
      }
    }
  }, [initialData]);

  // 데이터 변경 시 부모에게 알림
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        mission_config: {
          type: selectedMissionType,
          hashtags: hashtags.filter(tag => tag.trim() !== '')
        }
      });
    }
  }, [selectedMissionType, hashtags, onDataChange]);

  const handleHashtagChange = (index: number, value: string) => {
    const newHashtags = [...hashtags];
    newHashtags[index] = value;
    setHashtags(newHashtags);
  };

  const addHashtagInput = () => {
    if (hashtags.length < 3) {
      setHashtags([...hashtags, '']);
    }
  };

  const removeHashtagInput = (index: number) => {
    if (hashtags.length > 1) {
      const newHashtags = hashtags.filter((_, i) => i !== index);
      setHashtags(newHashtags);
    }
  };

  // 유효성 검사 함수
  const validate = (): { isValid: boolean; error?: string } => {
    const validHashtags = hashtags.filter(tag => tag.trim() !== '');
    
    if (validHashtags.length === 0) {
      return { isValid: false, error: '최소 1개 이상의 해시태그를 입력해주세요.' };
    }
    
    return { isValid: true };
  };

  const isValid = (): boolean => {
    return validate().isValid;
  };

  // ref를 통해 부모 컴포넌트에서 접근할 수 있도록 함수들을 노출
  useImperativeHandle(ref, () => ({
    validate,
    isValid,
  }));

  const infoBox = {
    stepNumber: 3,
    title: (
      <>
        이벤트 미션 설정 단계입니다. <span className="text-[#32373D] font-normal"><span className="text-[#4D82F3] font-bold">*표시</span>는 필수로 작성해야할 정보입니다.</span>
      </>
    ),
    description: [
      "미션 설정 단계는 이벤트에 참여한 사용자가 수행해야 할 행동을 설정하는 단계입니다.",
      "이 단계에서 설정한 미션은 사용자가 QR로 이벤트에 참여한 이후 인내됩니다."
    ]
  };

  const leftContent = (
    <div className="space-y-6">
      {/* 이벤트 미션 유형 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">이벤트 미션 유형</h3>
        
        <div className="space-y-3">
          <div className="w-1/2">
            <button
              onClick={() => setSelectedMissionType('sns')}
              className={`rounded border px-4 py-3 text-left transition-colors w-full ${
                selectedMissionType === 'sns'
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                {selectedMissionType === 'sns' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 17C13.3833 17 14.5625 16.5125 15.5375 15.5375C16.5125 14.5625 17 13.3833 17 12C17 10.6167 16.5125 9.4375 15.5375 8.4625C14.5625 7.4875 13.3833 7 12 7C10.6167 7 9.4375 7.4875 8.4625 8.4625C7.4875 9.4375 7 10.6167 7 12C7 13.3833 7.4875 14.5625 8.4625 15.5375C9.4375 16.5125 10.6167 17 12 17ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z" fill="#32373D"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z" fill="#32373D"/>
                  </svg>
                )}
                SNS 공유
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 해시태그 추가 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          해시태그 추가 <span className="text-[#4D82F3] font-bold">*</span>
        </h3>
        
        <div className="space-y-3">
          {hashtags.map((hashtag, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={hashtag}
                  onChange={(e) => handleHashtagChange(index, e.target.value)}
                  placeholder="#해시태그"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              {hashtags.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHashtagInput(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          {hashtags.length < 3 && (
            <button
              type="button"
              onClick={addHashtagInput}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              해시태그 추가
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const rightContent = (
    <div className="h-full min-h-[750px] flex flex-col">
        {/* 안내 메시지 - 흰색 배경 */}
        <div className="bg-white py-3 pr-6 mb-8">
        <p className="text-sm font-semibold text-gray-900 mb-1">이벤트 미션 미리보기</p>
        <p className="text-xs text-blue-600 mb-0.5">
          *이 QR 코드는 미리보기용입니다.
        </p>
        <p className="text-xs text-blue-600">
          실제 사용 시에는 최종 단계에서 QR을 다운로드해 인쇄 후 사용해 주세요.
        </p>
      </div>

        {/* 모바일 프레임 - 회색 배경 */}
        <div className="flex-1 flex items-start justify-center py-12 bg-gray-50 rounded-lg px-6">
        <PhoneFrame 
          innerBackgroundColor="#DEE7EC"
          noPadding={true}
          statusBarPadding={true}
        >
          {/* 배경 그리드 */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(182, 215, 255, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(182, 215, 255, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px'
            }}
          />

          {/* 메인 컨텐츠 */}
          <div className="relative z-10 w-full h-full flex flex-col">
            {/* 진행 단계 */}
            <div className="flex justify-center items-center gap-1.5 py-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium" style={{ backgroundColor: '#82BBFF' }}>1</div>
              <div className="w-4 h-0.5" style={{ backgroundColor: 'white' }}></div>
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-medium" style={{ color: '#56A3FF' }}>2</div>
              <div className="w-4 h-0.5" style={{ backgroundColor: '#AAD1FF' }}></div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium" style={{ backgroundColor: '#82BBFF' }}>3</div>
            </div>

            {/* 타이틀 영역 */}
            <div className="w-full text-center px-2 flex flex-col items-center justify-start gap-1">
              <div className="inline-flex items-center justify-center bg-black text-[#82BBFF] font-bold px-2.5 py-0.5 rounded-full h-4">
                <span className="text-[9px] leading-none font-bold">STEP 2</span>
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'rgba(59, 59, 59, 1)' }}>
                SNS 공유하기
              </h2>
              <p className="text-xs text-gray-600 text-center leading-tight">
                해시태그를 추가해 인스타그램,
                <br />
                페이스북, 카카오톡에 공유해 주세요!
              </p>
              
              {/* 해시태그 */}
              <div className="mt-1 flex flex-wrap gap-1 justify-center">
                {hashtags.filter(tag => tag.trim() !== '').map((tag, index) => (
                  <span key={index} className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#2377DA', color: 'white' }}>
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
                {hashtags.filter(tag => tag.trim() !== '').length === 0 && (
                  <>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#2377DA', color: 'white' }}>
                      @myminglz
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#2377DA', color: 'white' }}>
                      #샤로수길
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#2377DA', color: 'white' }}>
                      #해치
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 카메라 영역 */}
            <div className="flex-1 flex items-center justify-center p-4 pt-2">
              <div 
                className="w-full h-full relative overflow-hidden bg-[#F7F7F7]/40 rounded-xl flex items-center justify-center"
                style={{
                  backgroundImage: `url(/images/eventmission/eventPhoto.png)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
              </div>
            </div>

            {/* 하단 버튼들 */}
            <div className="absolute bottom-2 left-4 right-4 flex gap-2">
              <div className="flex gap-2 w-full">
                <button className="flex-1 bg-[#C7C7CE] text-white py-2 rounded text-xs font-medium">
                  다시 찍기
                </button>
                <button className="flex-1 text-white py-2 rounded text-xs font-medium" style={{ backgroundColor: '#479BFF' }}>
                  공유하기
                </button>
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 h-full bg-white">
      {/* 좌측: 입력 폼 */}
      <div className="px-6 pt-6 pb-6 bg-white h-full">
        {/* 정보 박스 */}
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
        
        {leftContent}
      </div>

      {/* 우측: 미리보기 */}
      <div className="pl-6 pt-6 pb-6 bg-white h-full">
        {rightContent}
      </div>
    </div>
  );
});

EventMissionSection.displayName = 'EventMissionSection';

export default EventMissionSection;
