'use client';

import { useState, useEffect, useRef } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ko } from 'react-day-picker/locale';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onDateChange: (startDate: string, endDate: string) => void;
}

export default function DateRangePicker({ startDate, endDate, onDateChange }: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedRange({
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
    });
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  return (
    <div className="relative">
      <div
        className="flex items-center rounded border border-gray-300 bg-white h-12 px-4 pr-10 cursor-pointer"
        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
      >
        {selectedRange?.from && selectedRange?.to ? (
          <span className="text-gray-900 text-sm">
            {format(selectedRange.from, 'yyyy-MM-dd')} ~ {format(selectedRange.to, 'yyyy-MM-dd')}
          </span>
        ) : selectedRange?.from ? (
          <span className="text-gray-900 text-sm">
            {format(selectedRange.from, 'yyyy-MM-dd')} ~ 마감일 선택 중...
          </span>
        ) : (
          <span className="text-sm text-gray-400">이벤트 시작일 ~ 이벤트 마감일을 설정해주세요.</span>
        )}
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      {isDatePickerOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsDatePickerOpen(false)} />
          <div ref={datePickerRef} className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded border border-gray-200 shadow-xl p-6 pointer-events-auto">
              <DayPicker
                mode="range"
                numberOfMonths={2}
                selected={selectedRange}
                onSelect={(range) => {
                  if (range) {
                    // 첫 번째 클릭: from만 있고 to가 없거나, from과 to가 같으면 from만 설정
                    if (!range.to || (range.from && range.to && range.from.getTime() === range.to.getTime())) {
                      setSelectedRange({ from: range.from, to: undefined });
                    } else if (range.from && range.to) {
                      // 두 번째 클릭: from과 to가 모두 설정되면 startDate, endDate 업데이트하고 닫기
                      const start = range.from.getTime() <= range.to.getTime() ? range.from : range.to;
                      const end = range.from.getTime() <= range.to.getTime() ? range.to : range.from;
                      setSelectedRange({ from: start, to: end });
                      onDateChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
                      setIsDatePickerOpen(false);
                    }
                  } else {
                    setSelectedRange(undefined);
                  }
                }}
                locale={ko}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
