'use client';

import { useState, useRef } from 'react';
import DateRangePicker from '../../create/components/DateRangePicker';

type TimePeriod = 'all' | 'yesterday' | 'today' | 'thisWeek' | 'thisMonth';

interface Event {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface StatsFilterProps {
  events: Event[];
  eventsLoading: boolean;
  selectedEvent: string;
  selectedPeriod: TimePeriod;
  customStartDate: string;
  customEndDate: string;
  showDatePicker: boolean;
  onEventChange: (eventId: string) => void;
  onPeriodChange: (period: TimePeriod) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  onShowDatePickerChange: (show: boolean) => void;
  onRefresh: () => void;
}

export default function StatsFilter({
  events,
  eventsLoading,
  selectedEvent,
  selectedPeriod,
  customStartDate,
  customEndDate,
  showDatePicker,
  onEventChange,
  onPeriodChange,
  onCustomDateChange,
  onShowDatePickerChange,
  onRefresh
}: StatsFilterProps) {
  const datePickerRef = useRef<HTMLDivElement>(null);

  // 이벤트가 시작되었는지 확인 (시작되지 않은 이벤트 필터링용)
  const isEventStarted = (event: Event) => {
    if (!event.start_date) return false;
    
    const today = new Date();
    const startDate = new Date(event.start_date);
    return startDate <= today;
  };

  // 통계에 표시할 이벤트 목록 (시작된 이벤트만)
  const availableEvents = events.filter(isEventStarted);

  // 선택된 이벤트의 날짜 범위 가져오기
  const getSelectedEventDateRange = () => {
    if (selectedEvent === '전체') {
      return { minDate: undefined, maxDate: undefined };
    }
    
    const event = events.find(e => e.id === selectedEvent);
    if (!event) {
      return { minDate: undefined, maxDate: undefined };
    }
    
    return {
      minDate: event.start_date || undefined,
      maxDate: event.end_date || undefined
    };
  };

  // 선택된 이벤트가 종료되었는지 확인
  const isSelectedEventEnded = () => {
    if (selectedEvent === '전체') return false;
    
    const event = events.find(e => e.id === selectedEvent);
    if (!event?.end_date) return false;
    
    const today = new Date();
    const endDate = new Date(event.end_date);
    return endDate < today;
  };

  return (
    <section className="bg-white px-0 pt-0 pb-0">
      <div>
        {/* 검색 필터 */}
        <div className="p-4" style={{ backgroundColor: '#F3F7FF' }}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold whitespace-nowrap" style={{ color: '#32373D' }}>
                이벤트
              </label>
              <div className="relative">
                <select
                  value={selectedEvent}
                  onChange={(e) => {
                    onEventChange(e.target.value);
                    // 이벤트 변경 시 항상 기간을 전체로 초기화
                    onPeriodChange('all');
                    onCustomDateChange('', '');
                    onShowDatePickerChange(false);
                  }}
                  disabled={eventsLoading}
                  className="w-64 px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm placeholder:text-sm appearance-none pr-10"
                  style={{ color: '#8E8E8E' }}
                >
                  <option value="전체" style={{ color: '#8E8E8E' }}>전체 이벤트 (통합)</option>
                  {eventsLoading ? (
                    <option value="" disabled style={{ color: '#8E8E8E' }}>로딩 중...</option>
                  ) : availableEvents.length === 0 ? (
                    <option value="" disabled style={{ color: '#8E8E8E' }}>시작된 이벤트가 없습니다</option>
                  ) : (
                    availableEvents.map((event) => (
                      <option key={event.id} value={event.id} style={{ color: '#8E8E8E' }}>
                        {event.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              <span className="text-sm font-bold" style={{ color: '#32373D' }}>범위</span>
              <button
                onClick={() => {
                  onPeriodChange('today');
                  onCustomDateChange('', '');
                  onShowDatePickerChange(false);
                }}
                disabled={isSelectedEventEnded()}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedPeriod === 'today'
                    ? 'text-white'
                    : 'bg-white hover:bg-gray-50 border border-gray-300'
                } ${isSelectedEventEnded() ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={selectedPeriod === 'today' ? { backgroundColor: '#414B55' } : { color: '#8E8E8E' }}
              >
                일간
              </button>
              <button
                onClick={() => {
                  onPeriodChange('thisWeek');
                  onCustomDateChange('', '');
                  onShowDatePickerChange(false);
                }}
                disabled={isSelectedEventEnded()}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedPeriod === 'thisWeek'
                    ? 'text-white'
                    : 'bg-white hover:bg-gray-50 border border-gray-300'
                } ${isSelectedEventEnded() ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={selectedPeriod === 'thisWeek' ? { backgroundColor: '#414B55' } : { color: '#8E8E8E' }}
              >
                주간
              </button>
              <button
                onClick={() => {
                  onPeriodChange('thisMonth');
                  onCustomDateChange('', '');
                  onShowDatePickerChange(false);
                }}
                disabled={isSelectedEventEnded()}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedPeriod === 'thisMonth'
                    ? 'text-white'
                    : 'bg-white hover:bg-gray-50 border border-gray-300'
                } ${isSelectedEventEnded() ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={selectedPeriod === 'thisMonth' ? { backgroundColor: '#414B55' } : { color: '#8E8E8E' }}
              >
                월간
              </button>
              
              <div className="flex items-center gap-2">
                <div className="relative" ref={datePickerRef}>
                  <button
                    onClick={() => onShowDatePickerChange(!showDatePicker)}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                      showDatePicker || (customStartDate && customEndDate)
                        ? 'text-white'
                        : 'bg-white hover:bg-gray-50 border border-gray-300'
                    }`}
                    style={
                      showDatePicker || (customStartDate && customEndDate)
                        ? { backgroundColor: '#414B55' }
                        : { color: '#8E8E8E' }
                    }
                  >
                    기간설정
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.5 3H16.5V1.5H15V3H9V1.5H7.5V3H4.5C3.675 3 3 3.675 3 4.5V19.5C3 20.325 3.675 21 4.5 21H19.5C20.325 21 21 20.325 21 19.5V4.5C21 3.675 20.325 3 19.5 3ZM19.5 19.5H4.5V9H19.5V19.5ZM19.5 7.5H4.5V4.5H7.5V6H9V4.5H15V6H16.5V4.5H19.5V7.5Z" fill={
                        showDatePicker || (customStartDate && customEndDate) ? "#FFFFFF" : "#8E8E8E"
                      }/>
                    </svg>
                  </button>
                  
                  {showDatePicker && (
                    <div 
                      className="absolute top-full left-0 mt-2 z-50"
                      onClick={(e) => e.stopPropagation()} // 외부 클릭 전파 방지
                    >
                      <DateRangePicker
                        startDate={customStartDate}
                        endDate={customEndDate}
                        onDateChange={(startDate, endDate) => {
                          onCustomDateChange(startDate, endDate);
                          onPeriodChange('all'); // 커스텀 기간으로 설정
                          // 달력을 자동으로 닫지 않음 - 사용자가 확인/취소 버튼으로 제어
                        }}
                        onClose={() => onShowDatePickerChange(false)} // 확인/취소 시 달력 닫기
                        placeholder="기간을 선택해주세요"
                        allowPastDates={true}
                        autoOpen={true}
                        hideInput={true}
                        minDate={getSelectedEventDateRange().minDate}
                        maxDate={getSelectedEventDateRange().maxDate}
                        defaultMonth={(() => {
                          // 종료된 이벤트의 경우 이벤트 시작 날짜 월로 설정
                          const minDate = getSelectedEventDateRange().minDate;
                          if (isSelectedEventEnded() && minDate) {
                            return new Date(minDate);
                          }
                          // 진행중/대기 이벤트는 현재 날짜 월로 설정
                          return new Date();
                        })()}
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}