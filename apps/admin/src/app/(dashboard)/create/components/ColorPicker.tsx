'use client';

import { colorPalette } from '../config/templateConfig';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-12 cursor-pointer rounded-md border border-gray-200 bg-white p-1 shadow-sm"
      />
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>현재 색상:</span>
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(event) => {
            // 입력 중에는 모든 값을 허용 (자유롭게 편집 가능)
            const newValue = event.target.value;
            onChange(newValue);
          }}
          onBlur={(event) => {
            // 포커스를 잃을 때 유효한 hex 색상으로 정규화
            const inputValue = event.target.value.trim();
            const hexPattern = /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i;
            
            if (inputValue === '' || inputValue === '#') {
              // 빈 값이면 기본값으로 복원
              onChange(value);
            } else if (hexPattern.test(inputValue)) {
              // 유효한 hex 색상이면 정규화 (# 추가)
              const normalizedValue = inputValue.startsWith('#') ? inputValue : `#${inputValue}`;
              onChange(normalizedValue);
            } else {
              // 유효하지 않은 값이면 원래 값으로 복원
              onChange(value);
            }
          }}
          placeholder="#000000"
          className="w-20 rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value.toUpperCase());
              alert('색상 코드가 클립보드에 복사되었습니다.');
            } catch (error) {
              alert('복사에 실패했습니다.');
            }
          }}
          className="text-gray-400 hover:text-gray-600"
          title="색상 코드 복사"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {colorPalette.map((color) => {
          const isSelected = value.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={`relative h-8 w-8 rounded border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            >
              {isSelected && (
                <svg
                  className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
