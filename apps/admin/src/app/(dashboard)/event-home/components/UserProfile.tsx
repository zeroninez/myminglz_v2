'use client';

interface UserProfileProps {
  displayName: string;
}

export default function UserProfile({ displayName }: UserProfileProps) {
  return (
    <div className="flex items-center justify-between mb-6 bg-[#F3F7FF] px-4 py-2 rounded">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex-shrink-0">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="4" fill="white"/>
            <path d="M23.9993 24.0013C27.6827 24.0013 30.666 21.018 30.666 17.3346C30.666 13.6513 27.6827 10.668 23.9993 10.668C20.316 10.668 17.3327 13.6513 17.3327 17.3346C17.3327 21.018 20.316 24.0013 23.9993 24.0013ZM23.9993 27.3346C19.5493 27.3346 10.666 29.568 10.666 34.0013V35.668C10.666 36.5846 11.416 37.3346 12.3327 37.3346H35.666C36.5827 37.3346 37.3327 36.5846 37.3327 35.668V34.0013C37.3327 29.568 28.4493 27.3346 23.9993 27.3346Z" fill="#6C7885"/>
          </svg>
        </div>
        <span className="font-medium text-gray-900">{displayName}</span>
      </div>
      <button className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
        Free
      </button>
    </div>
  );
}

