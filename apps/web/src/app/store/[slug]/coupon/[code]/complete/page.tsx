'use client';

export default function CompletePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-6">
          <svg 
            className="w-10 h-10 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        <h1 className="text-[28px] font-bold text-gray-900 mb-3">
          쿠폰 사용 완료
        </h1>
        
        <p className="text-[16px] text-gray-600 leading-relaxed">
          쿠폰이 정상적으로 사용되었습니다
        </p>
      </div>
    </div>
  );
}

