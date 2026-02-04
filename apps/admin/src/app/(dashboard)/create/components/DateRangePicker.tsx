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
  placeholder?: string;
  singleDateMode?: boolean;
  allowPastDates?: boolean;
  autoOpen?: boolean;
  hideInput?: boolean;
  minDate?: string;
  maxDate?: string;
  defaultMonth?: Date;
  onClose?: () => void; // 달력 닫기 콜백
}

export default function DateRangePicker({ startDate, endDate, onDateChange, placeholder = "이벤트 시작일 ~ 이벤트 마감일을 설정해주세요.", singleDateMode = false, allowPastDates = false, autoOpen = false, hideInput = false, minDate, maxDate, defaultMonth, onClose }: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  });
  const [tempRange, setTempRange] = useState<DateRange | undefined>({
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(autoOpen);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newRange = {
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
    };
    setSelectedRange(newRange);
    setTempRange(newRange);
  }, [startDate, endDate]);

  // autoOpen이 변경될 때 달력 상태 업데이트
  useEffect(() => {
    setIsDatePickerOpen(autoOpen);
  }, [autoOpen]);


  // 확인 버튼 클릭 시
  const handleConfirm = () => {
    if (tempRange?.from && tempRange?.to) {
      const start = tempRange.from.getTime() <= tempRange.to.getTime() ? tempRange.from : tempRange.to;
      const end = tempRange.from.getTime() <= tempRange.to.getTime() ? tempRange.to : tempRange.from;
      setSelectedRange({ from: start, to: end });
      onDateChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    } else if (tempRange?.from) {
      setSelectedRange({ from: tempRange.from, to: tempRange.from });
      onDateChange(format(tempRange.from, 'yyyy-MM-dd'), format(tempRange.from, 'yyyy-MM-dd'));
    }
    setIsDatePickerOpen(false);
    onClose?.(); // 외부 콜백 호출
  };

  // 취소 버튼 클릭 시
  const handleCancel = () => {
    setTempRange(selectedRange);
    setIsDatePickerOpen(false);
    onClose?.(); // 외부 콜백 호출
  };

  // 새로고침 버튼 클릭 시
  const handleRefresh = () => {
    setSelectedRange(undefined);
    setTempRange(undefined);
    onDateChange('', '');
    // 달력은 열린 상태로 유지
  };

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
      {!hideInput && (
        <div className="relative">
            <div
              className="flex items-center rounded border border-gray-300 bg-white h-12 px-4 pr-10 cursor-pointer"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            >
              {singleDateMode ? (
                selectedRange?.from ? (
                  <span className="text-gray-900 text-sm">
                    {format(selectedRange.from, 'yyyy-MM-dd')}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">{placeholder}</span>
                )
              ) : (
                selectedRange?.from && selectedRange?.to ? (
                  <span className="text-gray-900 text-sm">
                    {format(selectedRange.from, 'yyyy-MM-dd')} ~ {format(selectedRange.to, 'yyyy-MM-dd')}
                  </span>
                ) : selectedRange?.from ? (
                  <span className="text-gray-900 text-sm">
                    {format(selectedRange.from, 'yyyy-MM-dd')} ~ 마감일 선택 중...
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">{placeholder}</span>
                )
              )}
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
        </div>
      )}
      {isDatePickerOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsDatePickerOpen(false)} />
          <div ref={datePickerRef} className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded border border-gray-200 shadow-xl p-6 pointer-events-auto">
              {singleDateMode ? (
                <DayPicker
                  mode="single"
                  numberOfMonths={1}
                  selected={tempRange?.from}
                  defaultMonth={defaultMonth}
                  onSelect={(date) => {
                    if (date) {
                      setTempRange({ from: date, to: date });
                    } else {
                      setTempRange(undefined);
                    }
                  }}
                  locale={ko}
                  disabled={(date) => {
                    // 과거 날짜 제한
                    if (!allowPastDates && date < new Date(new Date().setHours(0, 0, 0, 0))) {
                      return true;
                    }
                    
                    // minDate와 maxDate 범위 제한 (시간을 00:00:00으로 설정하여 날짜만 비교)
                    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    
                    if (minDate) {
                      const minDateOnly = new Date(new Date(minDate).getFullYear(), new Date(minDate).getMonth(), new Date(minDate).getDate());
                      if (dateOnly < minDateOnly) {
                        return true;
                      }
                    }
                    
                    if (maxDate) {
                      const maxDateOnly = new Date(new Date(maxDate).getFullYear(), new Date(maxDate).getMonth(), new Date(maxDate).getDate());
                      if (dateOnly > maxDateOnly) {
                        return true;
                      }
                    }
                    
                    return false;
                  }}
                />
              ) : (
                <DayPicker
                  mode="range"
                  numberOfMonths={2}
                  selected={tempRange}
                  defaultMonth={defaultMonth}
                  onSelect={(range) => {
                    if (range) {
                      // 이미 완성된 범위가 있는 상태에서 새로운 날짜 클릭 시 새로 시작
                      if (tempRange?.from && tempRange?.to && range.from && 
                          (!range.to || range.from.getTime() === range.to.getTime())) {
                        // 새로운 시작점으로 설정
                        setTempRange({ from: range.from, to: undefined });
                      } else if (!range.to || (range.from && range.to && range.from.getTime() === range.to.getTime())) {
                        // 첫 번째 클릭 또는 같은 날짜 클릭
                        if (tempRange?.from && range.from && tempRange.from.getTime() === range.from.getTime()) {
                          // 같은 날짜를 다시 클릭한 경우 - 단일 날짜로 설정
                          setTempRange({ from: range.from, to: range.from });
                        } else {
                          // 첫 번째 클릭
                          setTempRange({ from: range.from, to: undefined });
                        }
                      } else if (range.from && range.to) {
                        // 두 번째 클릭: 범위 완성
                        const start = range.from.getTime() <= range.to.getTime() ? range.from : range.to;
                        const end = range.from.getTime() <= range.to.getTime() ? range.to : range.from;
                        setTempRange({ from: start, to: end });
                      }
                    } else {
                      setTempRange(undefined);
                    }
                  }}
                  locale={ko}
                  disabled={(date) => {
                    // 과거 날짜 제한
                    if (!allowPastDates && date < new Date(new Date().setHours(0, 0, 0, 0))) {
                      return true;
                    }
                    
                    // minDate와 maxDate 범위 제한 (시간을 00:00:00으로 설정하여 날짜만 비교)
                    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    
                    if (minDate) {
                      const minDateOnly = new Date(new Date(minDate).getFullYear(), new Date(minDate).getMonth(), new Date(minDate).getDate());
                      if (dateOnly < minDateOnly) {
                        return true;
                      }
                    }
                    
                    if (maxDate) {
                      const maxDateOnly = new Date(new Date(maxDate).getFullYear(), new Date(maxDate).getMonth(), new Date(maxDate).getDate());
                      if (dateOnly > maxDateOnly) {
                        return true;
                      }
                    }
                    
                    return false;
                  }}
                />
              )}
              
              {/* 확인/취소/새로고침 버튼 */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                  title="날짜 초기화"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  초기화
                </button>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!tempRange?.from}
                    className="px-4 py-2 text-sm text-white bg-[#414B55] rounded hover:bg-[#32373D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
