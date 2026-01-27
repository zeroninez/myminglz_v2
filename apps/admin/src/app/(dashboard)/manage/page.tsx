'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useEvents } from '@/contexts/EventsContext';
import { QRCodeService } from '@myminglz/core/src/utils/qr';
import { QR_SIZES, IMAGE_FORMATS, type QRSize, type ImageFormat, type QRCodeData, printQRCode, saveQRCode } from './utils/qrPrint';
import DateRangePicker from '../create/components/DateRangePicker';

interface Event {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  event_info_config?: {
    stores?: Array<{ id?: string; name: string }>;
  } | null;
  created_at: string;
  updated_at: string;
}

type EventStatus = 'all' | 'waiting' | 'ongoing' | 'ended';
type SortOption = 'latest' | 'oldest' | 'name_asc' | 'name_desc' | 'updated';

export default function ManagePage() {
  const { events: cachedEvents, loading: eventsLoading, error: eventsError } = useEvents();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<number, QRSize>>({});
  const [selectedFormats, setSelectedFormats] = useState<Record<number, ImageFormat>>({});
  const [sizeSelectMode, setSizeSelectMode] = useState<Record<number, 'print' | 'save' | null>>({});
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrModalType, setQrModalType] = useState<'event' | 'store'>('event');
  
  // 새로운 상태들
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [activeTab, setActiveTab] = useState<EventStatus>('all');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const loading = eventsLoading;
  const error = eventsError;

  // Context에서 이벤트 데이터 가져오기 - 불필요한 업데이트 방지
  useEffect(() => {
    if (cachedEvents && cachedEvents.length > 0) {
      setEvents(cachedEvents as Event[]);
    } else if (cachedEvents && cachedEvents.length === 0) {
      // 빈 배열인 경우도 업데이트하여 초기화 상태 유지
      setEvents([]);
    }
  }, [cachedEvents]);

  // 이벤트 상태 판단 함수
  const getEventStatus = (event: Event): EventStatus => {
    if (!event.start_date || !event.end_date) return 'waiting';
    
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    if (now < startDate) return 'waiting';
    if (now > endDate) return 'ended';
    return 'ongoing';
  };

  // 이벤트 필터링 및 정렬
  useEffect(() => {
    let filtered = [...events];

    // 이름으로 필터링
    if (searchName.trim()) {
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // 날짜로 필터링 (해당 날짜에 진행중이거나 종료된 이벤트)
    if (searchDate) {
      filtered = filtered.filter(event => {
        if (!event.start_date || !event.end_date) return false;
        
        const eventStart = new Date(event.start_date);
        const eventEnd = new Date(event.end_date);
        const selectedDate = new Date(searchDate);
        
        // 선택한 날짜가 이벤트 기간 내에 있거나, 이벤트가 이미 시작되었으면 표시
        return selectedDate >= eventStart && selectedDate <= eventEnd;
      });
    }

    // 상태로 필터링
    if (activeTab !== 'all') {
      filtered = filtered.filter(event => getEventStatus(event) === activeTab);
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'latest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
    setSelectedEventIds(new Set());
    setSelectAll(false);
  }, [events, searchName, searchDate, activeTab, sortOption]);

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(filteredEvents.map(event => event.id)));
    }
    setSelectAll(!selectAll);
  };

  // 개별 선택/해제
  const handleSelectEvent = (eventId: string) => {
    const newSelected = new Set(selectedEventIds);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEventIds(newSelected);
    setSelectAll(newSelected.size === filteredEvents.length);
  };

  // 상태별 개수 계산
  const getStatusCounts = () => {
    const counts = {
      all: events.length,
      waiting: 0,
      ongoing: 0,
      ended: 0,
    };

    events.forEach(event => {
      const status = getEventStatus(event);
      counts[status]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

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

  // 정렬 옵션 변경
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setShowSortDropdown(false);
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSortDropdown) {
        const target = event.target as Element;
        if (!target.closest('.sort-dropdown')) {
          setShowSortDropdown(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSortDropdown]);

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://myminglz-v2-web.vercel.app';

  // QR 코드 모달 열기
  const handleOpenQRModal = async (event: Event, type: 'event' | 'store' = 'event') => {
    setSelectedEvent(event);
    setQrModalType(type);
    setQrLoading(true);
    setQrCodes([]);

    try {
      const qrCodeList: QRCodeData[] = [];
      
      if (type === 'event') {
        // 도메인 주소 QR 코드만 생성
        const eventUrl = `${baseUrl}/${event.domain_code}`;
        const eventQRCode = await QRCodeService.generateQRCodeURL(eventUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        qrCodeList.push({
          label: '이벤트 도메인 주소',
          url: eventUrl,
          qrCodeUrl: eventQRCode,
        });
      } else if (type === 'store') {
        // 사용처별 QR 코드만 생성
        const stores = event.event_info_config?.stores || [];
        for (const store of stores) {
          if (store.id) {
            const verifyUrl = `${baseUrl}/${event.domain_code}/verify/${store.id}`;
            const storeQRCode = await QRCodeService.generateQRCodeURL(verifyUrl, {
              width: 200,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#ffffff',
              },
            });
            qrCodeList.push({
              label: `${store.name || '사용처'} 인증 QR`,
              url: verifyUrl,
              qrCodeUrl: storeQRCode,
            });
          }
        }
      }

      setQrCodes(qrCodeList);
    } catch (err) {
      console.error('QR 코드 생성 오류:', err);
      setQrError('QR 코드 생성 중 오류가 발생했습니다.');
    } finally {
      setQrLoading(false);
    }
  };

  // QR 코드 모달 닫기
  const handleCloseQRModal = () => {
    setSelectedEvent(null);
    setQrCodes([]);
    setSelectedSizes({});
    setSelectedFormats({});
    setSizeSelectMode({});
  };

  // 인쇄 버튼 클릭 - 사이즈 선택 모드로 전환
  const handlePrintClick = (index: number) => {
    setSizeSelectMode(prev => ({
      ...prev,
      [index]: 'print',
    }));
  };

  // 저장 버튼 클릭 - 사이즈 선택 모드로 전환
  const handleSaveClick = (index: number) => {
    setSizeSelectMode(prev => ({
      ...prev,
      [index]: 'save',
    }));
  };

  // 사이즈 선택 후 실행
  const handleSizeConfirm = async (index: number) => {
    const qrData = qrCodes[index];
    const mode = sizeSelectMode[index];
    if (!qrData || !mode) return;

    const size = selectedSizes[index] || 357;

    try {
      if (mode === 'print') {
        await printQRCode(qrData, size);
      } else if (mode === 'save') {
        const format = selectedFormats[index] || 'png';
        await saveQRCode(qrData, size, format, selectedEvent?.name);
      }
      // 사이즈 선택 모드 해제
      setSizeSelectMode(prev => {
        const newMode = { ...prev };
        delete newMode[index];
        return newMode;
      });
    } catch (err) {
      console.error(`QR 코드 ${mode === 'print' ? '인쇄' : '저장'} 오류:`, err);
      alert(
        err instanceof Error
          ? err.message
          : `QR 코드 ${mode === 'print' ? '인쇄' : '저장'} 중 오류가 발생했습니다.`
      );
    }
  };

  // 사이즈 선택 취소
  const handleSizeCancel = (index: number) => {
    setSizeSelectMode(prev => {
      const newMode = { ...prev };
      delete newMode[index];
      return newMode;
    });
  };

  // 삭제 확인 모달 열기
  const handleDeleteClick = (event: Event) => {
    setShowDeleteConfirm(event.id);
  };

  // 삭제 확인 모달 닫기
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  // 일괄 삭제 확인
  const handleBulkDeleteClick = () => {
    if (selectedEventIds.size > 0) {
      setShowBulkDeleteConfirm(true);
    }
  };

  // 일괄 삭제 실행
  const handleBulkDeleteConfirm = async () => {
    try {
      setDeletingBulk(true);
      setShowBulkDeleteConfirm(false);

      const deletePromises = Array.from(selectedEventIds).map(eventId =>
        fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      );

      const results = await Promise.all(deletePromises);
      const responses = await Promise.all(results.map(r => r.json()));

      const failedDeletes = responses.filter(r => !r.success);
      if (failedDeletes.length > 0) {
        alert(`${failedDeletes.length}개 이벤트 삭제에 실패했습니다.`);
      }

      // 성공적으로 삭제된 이벤트들을 목록에서 제거
      const successfulDeletes = Array.from(selectedEventIds).filter((_, index) => 
        responses[index].success
      );
      
      setEvents(prev => prev.filter(event => !successfulDeletes.includes(event.id)));
      setSelectedEventIds(new Set());
      setSelectAll(false);
      
      alert(`${successfulDeletes.length}개 이벤트가 성공적으로 삭제되었습니다.`);
    } catch (err: any) {
      console.error('일괄 삭제 오류:', err);
      alert('이벤트 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingBulk(false);
    }
  };

  // 일괄 삭제 취소
  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteConfirm(false);
  };

  // 이벤트 삭제
  const handleDeleteConfirm = async (eventId: string) => {
    try {
      setDeletingEventId(eventId);
      setShowDeleteConfirm(null);

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.error || '이벤트 삭제에 실패했습니다.');
        return;
      }

      // 이벤트 목록에서 제거
      setEvents(prev => prev.filter(event => event.id !== eventId));
      alert('이벤트가 성공적으로 삭제되었습니다.');
    } catch (err: any) {
      console.error('이벤트 삭제 오류:', err);
      alert('이벤트 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6">
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-5">전체 내 이벤트</h2>
      </div>
      <section className="border-t border-x border-b border-gray-200 bg-white px-0 pt-0 pb-0 shadow-sm">
        <div>
        
        {/* 검색 필터 */}
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
                  onChange={(e) => setSearchName(e.target.value)}
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
                    setSearchDate(selectedDate);
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
                  onClick={() => {
                    setSearchName('');
                    setSearchDate('');
                  }}
                  className="px-6 py-2 bg-white rounded hover:bg-gray-50 transition-colors h-10 border border-gray-300"
                  style={{ color: '#414B55' }}
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 제목과 정렬 */}
        <div className="flex justify-between items-center px-4 py-4">
          <h3 className="text-lg font-semibold" style={{ color: '#32373D' }}>
            전체 내 이벤트
          </h3>
          <div className="relative sort-dropdown">
            <button 
              onClick={() => setShowSortDropdown(!showSortDropdown)}
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
                    onClick={() => handleSortChange(option.key as SortOption)}
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
              onClick={() => setActiveTab(tab.key as EventStatus)}
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
              onClick={handleBulkDeleteClick}
              disabled={deletingBulk}
              className="text-sm font-medium px-4 py-2 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: '#4D82F3' }}
            >
              {deletingBulk ? '삭제 중...' : '삭제하기'}
            </button>
          )}
        </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">로딩 중...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-600">{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">생성된 이벤트가 없습니다.</p>
          <Link
            href="/create"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            이벤트 생성하기
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">

          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ backgroundColor: '#F3F4F6' }}>
                <tr className="border-b border-gray-200">
                   <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 border-r border-gray-200" style={{ color: '#8F8F8F' }}>
                     <input
                       type="checkbox"
                       checked={selectAll}
                       onChange={handleSelectAll}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                   </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 whitespace-nowrap" style={{ color: '#8F8F8F' }}>
                      이벤트 명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 whitespace-nowrap" style={{ color: '#8F8F8F' }}>
                      이벤트 기간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 whitespace-nowrap" style={{ color: '#8F8F8F' }}>
                      이벤트 미리보기
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    사용처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    다운로드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    생성일
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200 whitespace-nowrap" style={{ color: '#8F8F8F' }}>
                      이벤트 상태
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: '#8F8F8F' }}>
                      수정
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => {
                  const eventUrl = `${baseUrl}/${event.domain_code}`;
                  const stores = Array.isArray(event.event_info_config?.stores) 
                    ? event.event_info_config.stores.filter((store: any) => store && store.name)
                    : [];
                  const storeCount = stores.length;
                  const eventStatus = getEventStatus(event);
                  
                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <input
                          type="checkbox"
                          checked={selectedEventIds.has(event.id)}
                          onChange={() => handleSelectEvent(event.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="text-sm font-medium text-gray-900">{event.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="text-sm text-gray-500">
                          {event.start_date && event.end_date
                            ? `${new Date(event.start_date).toLocaleDateString('ko-KR')} ~ ${new Date(event.end_date).toLocaleDateString('ko-KR')}`
                            : '기간 미설정'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <a
                          href={eventUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {event.domain_code}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="text-sm text-gray-500">
                          {storeCount > 0 ? (
                            storeCount === 1 ? 
                              stores[0]?.name || '사용처 없음' : 
                              `${stores[0]?.name || '사용처'} 외 ${storeCount - 1}곳`
                          ) : '사용처 없음'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleOpenQRModal(event)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors w-28"
                          >
                            이벤트 QR
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18.2199 20.75H5.77994C5.43316 20.7359 5.09256 20.6535 4.77765 20.5075C4.46274 20.3616 4.17969 20.155 3.9447 19.8996C3.70971 19.6442 3.52739 19.3449 3.40818 19.019C3.28896 18.693 3.23519 18.3468 3.24994 18V15C3.24994 14.8011 3.32896 14.6103 3.46961 14.4697C3.61027 14.329 3.80103 14.25 3.99994 14.25C4.19886 14.25 4.38962 14.329 4.53027 14.4697C4.67093 14.6103 4.74994 14.8011 4.74994 15V18C4.72412 18.2969 4.81359 18.5924 4.99977 18.8251C5.18596 19.0579 5.45459 19.21 5.74994 19.25H18.2199C18.5153 19.21 18.7839 19.0579 18.9701 18.8251C19.1563 18.5924 19.2458 18.2969 19.2199 18V15C19.2199 14.8011 19.299 14.6103 19.4396 14.4697C19.5803 14.329 19.771 14.25 19.9699 14.25C20.1689 14.25 20.3596 14.329 20.5003 14.4697C20.6409 14.6103 20.7199 14.8011 20.7199 15V18C20.7499 18.6954 20.504 19.3744 20.0358 19.8894C19.5676 20.4045 18.915 20.7137 18.2199 20.75Z" fill="currentColor"/>
                              <path d="M12.0001 15.7508C11.9016 15.7513 11.8039 15.7321 11.7129 15.6943C11.6219 15.6565 11.5393 15.6009 11.4701 15.5308L7.47009 11.5308C7.33761 11.3886 7.26549 11.2006 7.26892 11.0063C7.27234 10.812 7.35106 10.6266 7.48847 10.4892C7.62588 10.3518 7.81127 10.2731 8.00557 10.2696C8.19987 10.2662 8.38792 10.3383 8.53009 10.4708L12.0001 13.9408L15.4701 10.4708C15.6123 10.3383 15.8003 10.2662 15.9946 10.2696C16.1889 10.2731 16.3743 10.3518 16.5117 10.4892C16.6491 10.6266 16.7278 10.812 16.7313 11.0063C16.7347 11.2006 16.6626 11.3886 16.5301 11.5308L12.5301 15.5308C12.4608 15.6009 12.3783 15.6565 12.2873 15.6943C12.1963 15.7321 12.0986 15.7513 12.0001 15.7508Z" fill="currentColor"/>
                              <path d="M12 15.75C11.8019 15.7474 11.6126 15.6676 11.4725 15.5275C11.3324 15.3874 11.2526 15.1981 11.25 15V4C11.25 3.80109 11.329 3.61032 11.4697 3.46967C11.6103 3.32902 11.8011 3.25 12 3.25C12.1989 3.25 12.3897 3.32902 12.5303 3.46967C12.671 3.61032 12.75 3.80109 12.75 4V15C12.7474 15.1981 12.6676 15.3874 12.5275 15.5275C12.3874 15.6676 12.1981 15.7474 12 15.75Z" fill="currentColor"/>
                            </svg>
                          </button>
                          {storeCount > 0 && (
                            <button
                              onClick={() => handleOpenQRModal(event, 'store')}
                              className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors w-28"
                            >
                              사용처 QR
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18.2199 20.75H5.77994C5.43316 20.7359 5.09256 20.6535 4.77765 20.5075C4.46274 20.3616 4.17969 20.155 3.9447 19.8996C3.70971 19.6442 3.52739 19.3449 3.40818 19.019C3.28896 18.693 3.23519 18.3468 3.24994 18V15C3.24994 14.8011 3.32896 14.6103 3.46961 14.4697C3.61027 14.329 3.80103 14.25 3.99994 14.25C4.19886 14.25 4.38962 14.329 4.53027 14.4697C4.67093 14.6103 4.74994 14.8011 4.74994 15V18C4.72412 18.2969 4.81359 18.5924 4.99977 18.8251C5.18596 19.0579 5.45459 19.21 5.74994 19.25H18.2199C18.5153 19.21 18.7839 19.0579 18.9701 18.8251C19.1563 18.5924 19.2458 18.2969 19.2199 18V15C19.2199 14.8011 19.299 14.6103 19.4396 14.4697C19.5803 14.329 19.771 14.25 19.9699 14.25C20.1689 14.25 20.3596 14.329 20.5003 14.4697C20.6409 14.6103 20.7199 14.8011 20.7199 15V18C20.7499 18.6954 20.504 19.3744 20.0358 19.8894C19.5676 20.4045 18.915 20.7137 18.2199 20.75Z" fill="currentColor"/>
                                <path d="M12.0001 15.7508C11.9016 15.7513 11.8039 15.7321 11.7129 15.6943C11.6219 15.6565 11.5393 15.6009 11.4701 15.5308L7.47009 11.5308C7.33761 11.3886 7.26549 11.2006 7.26892 11.0063C7.27234 10.812 7.35106 10.6266 7.48847 10.4892C7.62588 10.3518 7.81127 10.2731 8.00557 10.2696C8.19987 10.2662 8.38792 10.3383 8.53009 10.4708L12.0001 13.9408L15.4701 10.4708C15.6123 10.3383 15.8003 10.2662 15.9946 10.2696C16.1889 10.2731 16.3743 10.3518 16.5117 10.4892C16.6491 10.6266 16.7278 10.812 16.7313 11.0063C16.7347 11.2006 16.6626 11.3886 16.5301 11.5308L12.5301 15.5308C12.4608 15.6009 12.3783 15.6565 12.2873 15.6943C12.1963 15.7321 12.0986 15.7513 12.0001 15.7508Z" fill="currentColor"/>
                                <path d="M12 15.75C11.8019 15.7474 11.6126 15.6676 11.4725 15.5275C11.3324 15.3874 11.2526 15.1981 11.25 15V4C11.25 3.80109 11.329 3.61032 11.4697 3.46967C11.6103 3.32902 11.8011 3.25 12 3.25C12.1989 3.25 12.3897 3.32902 12.5303 3.46967C12.671 3.61032 12.75 3.80109 12.75 4V15C12.7474 15.1981 12.6676 15.3874 12.5275 15.5275C12.3874 15.6676 12.1981 15.7474 12 15.75Z" fill="currentColor"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="text-sm text-gray-500">
                          {new Date(event.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: eventStatus === 'waiting' 
                                ? '#FF9945'
                                : eventStatus === 'ongoing'
                                ? '#48CC8E'
                                : '#888888'
                            }}
                          ></div>
                          <span 
                            className="text-sm font-medium"
                            style={{
                              color: eventStatus === 'waiting' 
                                ? '#FF9945'
                                : eventStatus === 'ongoing'
                                ? '#48CC8E'
                                : '#888888'
                            }}
                          >
                            {eventStatus === 'waiting' ? '대기' : eventStatus === 'ongoing' ? '진행중' : '종료'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/create/${event.id}`}
                          className="text-gray-600 hover:text-gray-900"
                          title="수정"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR 코드 인쇄 모달 */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedEvent.name} - {qrModalType === 'event' ? '이벤트' : '사용처'} QR 코드
              </h3>
              <button
                onClick={handleCloseQRModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {qrLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-sm text-gray-500">QR 코드 생성 중...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {qrCodes.map((qrData, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {qrData.label}
                          </h4>
                          <p className="text-sm text-gray-600 break-all">
                            {qrData.url}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {sizeSelectMode[index] ? (
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="text-sm font-medium text-gray-700">
                              {sizeSelectMode[index] === 'print' ? '인쇄' : '저장'} 설정:
                            </label>
                            <select
                              value={selectedSizes[index] || 357}
                              onChange={(e) => {
                                const newSize = Number(e.target.value) as QRSize;
                                setSelectedSizes(prev => ({
                                  ...prev,
                                  [index]: newSize,
                                }));
                              }}
                              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {QR_SIZES.map((size) => (
                                <option key={size} value={size}>
                                  {size}x{size}
                                </option>
                              ))}
                            </select>
                            {sizeSelectMode[index] === 'save' && (
                              <select
                                value={selectedFormats[index] || 'png'}
                                onChange={(e) => {
                                  const newFormat = e.target.value as ImageFormat;
                                  setSelectedFormats(prev => ({
                                    ...prev,
                                    [index]: newFormat,
                                  }));
                                }}
                                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {IMAGE_FORMATS.map((format) => (
                                  <option key={format} value={format}>
                                    {format.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            )}
                            <button
                              onClick={() => handleSizeConfirm(index)}
                              className={`px-3 py-1.5 text-sm text-white rounded-lg hover:opacity-90 transition-colors ${
                                sizeSelectMode[index] === 'print'
                                  ? 'bg-blue-500 hover:bg-blue-600'
                                  : 'bg-green-500 hover:bg-green-600'
                              }`}
                            >
                              확인
                            </button>
                            <button
                              onClick={() => handleSizeCancel(index)}
                              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePrintClick(index)}
                              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              title="인쇄"
                            >
                              인쇄
                            </button>
                            <button
                              onClick={() => handleSaveClick(index)}
                              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              title="저장"
                            >
                              저장
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {qrData.qrCodeUrl && (
                      <div className="flex justify-center">
                        <img
                          src={qrData.qrCodeUrl}
                          alt={`${qrData.label} QR 코드`}
                          className="w-48 h-48"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseQRModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 삭제 확인 모달 */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              이벤트 삭제 확인
            </h3>
            <p className="text-gray-600 mb-6">
              정말로 선택된 {selectedEventIds.size}개의 이벤트를 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-medium">
                이 작업은 되돌릴 수 없으며, 관련된 모든 데이터(쿠폰, 매장, 방문 기록 등)가 함께 삭제됩니다.
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleBulkDeleteCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={deletingBulk}
              >
                취소
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={deletingBulk}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingBulk ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              이벤트 삭제 확인
            </h3>
            <p className="text-gray-600 mb-6">
              정말로 이 이벤트를 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-medium">
                이 작업은 되돌릴 수 없으며, 관련된 모든 데이터(쿠폰, 매장, 방문 기록 등)가 함께 삭제됩니다.
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={deletingEventId !== null}
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                disabled={deletingEventId !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingEventId ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}



