'use client';

import { ChangeEvent } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  variant?: 'dark' | 'blue'; // 'dark'는 검은색 테마, 'blue'는 파란색 테마
  className?: string;
}

export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  variant = 'dark',
  className = '',
}: ToggleProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  // 검은색 테마 스타일 (기본)
  const darkThemeClasses = `
    w-11 h-6 bg-white border-2 border-[#414B55] 
    peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 
    rounded-full peer 
    peer-checked:bg-[#414B55] 
    peer-checked:border-2 peer-checked:border-[#414B55] 
    peer-checked:after:translate-x-[20px] 
    after:content-[''] after:absolute after:top-[3px] after:left-[3px] 
    after:bg-[#414B55] after:rounded-full after:h-[18px] after:w-[18px] 
    after:transition-all after:duration-300 
    peer-checked:after:bg-white
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  // 파란색 테마 스타일
  const blueThemeClasses = `
    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer 
    rounded-full border-2 border-transparent 
    transition-colors duration-200 ease-in-out 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    ${checked ? 'bg-blue-600' : 'bg-gray-200'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  const switchClasses = variant === 'dark' ? darkThemeClasses : blueThemeClasses;

  if (variant === 'blue') {
    // 파란색 테마는 button 기반
    return (
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`${switchClasses} ${className}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    );
  }

  // 검은색 테마는 checkbox 기반 (기본)
  if (label) {
    return (
      <label className={`flex items-center justify-between cursor-pointer ${className}`}>
        {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
        <div className="relative inline-block w-11 h-6">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className={switchClasses}></div>
        </div>
      </label>
    );
  }

  // 라벨 없는 경우
  return (
    <label className={`relative inline-block w-11 h-6 cursor-pointer ${disabled ? 'cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className={switchClasses}></div>
    </label>
  );
}
