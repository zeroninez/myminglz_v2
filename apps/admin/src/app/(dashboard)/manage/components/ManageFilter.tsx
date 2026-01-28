'use client';

import DateRangePicker from '../../create/components/DateRangePicker';

interface ManageFilterProps {
  searchName: string;
  searchDate: string;
  onSearchNameChange: (name: string) => void;
  onSearchDateChange: (date: string) => void;
  onReset: () => void;
}

export default function ManageFilter({
  searchName,
  searchDate,
  onSearchNameChange,
  onSearchDateChange,
  onReset
}: ManageFilterProps) {
  return (
    <div className="p-4" style={{ backgroundColor: '#F3F7FF' }}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold whitespace-nowrap" style={{ color: '#32373D' }}>
            이벤트 명
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchName}
              onChange={(e) => onSearchNameChange(e.target.value)}
              placeholder="이벤트 명을 검색해주세요"
              className="w-64 px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm placeholder:text-sm"
            />
            <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold whitespace-nowrap" style={{ color: '#32373D' }}>
            이벤트 기간
          </label>
          <div className="w-80">
            <DateRangePicker
              startDate={searchDate}
              endDate=""
              onDateChange={(selectedDate) => {
                onSearchDateChange(selectedDate);
              }}
              placeholder="이벤트 기간을 검색해주세요"
              singleDateMode={true}
              allowPastDates={true}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            className="px-6 py-2 text-white rounded hover:opacity-90 transition-colors h-10"
            style={{ backgroundColor: '#414B55' }}
          >
            검색
          </button>
          {(searchName || searchDate) && (
            <button 
              onClick={onReset}
              className="px-6 py-2 bg-white rounded hover:bg-gray-50 transition-colors h-10 border border-gray-300"
              style={{ color: '#414B55' }}
            >
              초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
}