'use client';

import { useEffect } from 'react';

type EventStatus = 'all' | 'waiting' | 'ongoing' | 'ended';
type SortOption = 'latest' | 'oldest' | 'name_asc' | 'name_desc' | 'updated';

interface StatusCounts {
  all: number;
  waiting: number;
  ongoing: number;
  ended: number;
}

interface ManageTabsProps {
  activeTab: EventStatus;
  sortOption: SortOption;
  statusCounts: StatusCounts;
  showSortDropdown: boolean;
  selectedEventIds: Set<string>;
  onTabChange: (tab: EventStatus) => void;
  onSortChange: (option: SortOption) => void;
  onShowSortDropdownChange: (show: boolean) => void;
  onBulkDelete: () => void;
  deletingBulk: boolean;
}

export default function ManageTabs({
  activeTab,
  sortOption,
  statusCounts,
  showSortDropdown,
  selectedEventIds,
  onTabChange,
  onSortChange,
  onShowSortDropdownChange,
  onBulkDelete,
  deletingBulk
}: ManageTabsProps) {
  // 정렬 옵션 레이블
  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'latest': return '최근 생성순';
      case 'oldest': return '오래된 순';
      case 'updated': return '최근 수정순';
      case 'name_asc': return '이름 오름차순';
      case 'name_desc': return '이름 내림차순';
      default: return '최근 생성순';
    }
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSortDropdown) {
        const target = event.target as Element;
        if (!target.closest('.sort-dropdown')) {
          onShowSortDropdownChange(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSortDropdown, onShowSortDropdownChange]);

  return (
    <>
      {/* 제목과 정렬 */}
      <div className="flex justify-between items-center px-4 py-4">
        <h3 className="text-lg font-semibold" style={{ color: '#32373D' }}>
          전체 내 이벤트
        </h3>
        <div className="relative sort-dropdown">
          <button 
            onClick={() => onShowSortDropdownChange(!showSortDropdown)}
            className="flex items-center gap-2 text-sm" 
            style={{ color: '#888888' }}
          >
            {getSortLabel(sortOption)}
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-10">
              {[
                { key: 'latest', label: '최근 생성순' },
                { key: 'oldest', label: '오래된 순' },
                { key: 'updated', label: '최근 수정순' },
                { key: 'name_asc', label: '이름 오름차순' },
                { key: 'name_desc', label: '이름 내림차순' },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => onSortChange(option.key as SortOption)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    sortOption === option.key ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 상태 탭 */}
      <div className="flex space-x-1 px-4 py-0">
        {[
          { key: 'all', label: '전체', count: statusCounts.all },
          { key: 'waiting', label: '대기', count: statusCounts.waiting },
          { key: 'ongoing', label: '진행중', count: statusCounts.ongoing },
          { key: 'ended', label: '종료', count: statusCounts.ended },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key as EventStatus)}
            className="px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab.key ? '#414B55' : '#F3F4F6',
              color: activeTab === tab.key ? '#FFFFFF' : '#8E8E8E'
            }}
          >
            {tab.label}({tab.count})
          </button>
        ))}
      </div>

      {/* 선택된 개수와 삭제 버튼 */}
      <div className="flex justify-between items-center px-4 py-3">
        <div className="text-sm font-medium" style={{ color: '#32373D' }}>
          {selectedEventIds.size > 0 && (
            <>
              {activeTab === 'all' && `전체선택(${selectedEventIds.size})`}
              {activeTab === 'waiting' && `대기선택(${selectedEventIds.size})`}
              {activeTab === 'ongoing' && `진행중선택(${selectedEventIds.size})`}
              {activeTab === 'ended' && `종료선택(${selectedEventIds.size})`}
            </>
          )}
        </div>
        {selectedEventIds.size > 0 && (
          <button
            onClick={onBulkDelete}
            disabled={deletingBulk}
            className="text-sm font-medium px-4 py-2 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: '#4D82F3' }}
          >
            {deletingBulk ? '삭제 중...' : '삭제하기'}
          </button>
        )}
      </div>
    </>
  );
}