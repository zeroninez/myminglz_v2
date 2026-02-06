'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useEvents } from '@/contexts/EventsContext';
import { QRCodeService } from '@myminglz/core/src/utils/qr';
import { QR_SIZES, IMAGE_FORMATS, type QRSize, type ImageFormat, type QRCodeData, printQRCode, saveQRCode } from './utils/qrPrint';
import ManageFilter from './components/ManageFilter';
import ManageTabs from './components/ManageTabs';
import ManageTable from './components/ManageTable';
import QRModal from './components/QRModal';
import DeleteModals from './components/DeleteModals';

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

  // URL 파라미터에서 초기 필터 설정
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam && ['all', 'ongoing', 'waiting', 'ended'].includes(filterParam)) {
      setActiveTab(filterParam as EventStatus);
    }
  }, []);

  // Context에서 이벤트 데이터 가져오기 - 불필요한 업데이트 방지
  useEffect(() => {
    if (cachedEvents && cachedEvents.length > 0) {
      setEvents(cachedEvents as Event[]);
    } else if (cachedEvents && cachedEvents.length === 0) {
      // 빈 배열인 경우도 업데이트하여 초기화 상태 유지
      setEvents([]);
    }
  }, [cachedEvents]);


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
      filtered = filtered.filter(event => {
        // getEventStatus 함수를 여기서 정의
        const getStatus = (event: Event): EventStatus => {
          if (!event.start_date || !event.end_date) return 'waiting';
          
          const now = new Date();
          const startDate = new Date(event.start_date);
          const endDate = new Date(event.end_date);
          
          if (now < startDate) return 'waiting';
          if (now > endDate) return 'ended';
          return 'ongoing';
        };
        
        return getStatus(event) === activeTab;
      });
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

  // 이벤트 상태 판단 함수
  const getEventStatus = (event: Event): EventStatus => {
    if (!event.start_date || !event.end_date) return 'waiting';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(event.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(event.end_date);
    endDate.setHours(23, 59, 59, 999); // 종료일은 해당 날짜의 마지막 시간까지
    
    if (today < startDate) return 'waiting';
    if (today > endDate) return 'ended';
    return 'ongoing';
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

  // 정렬 옵션 변경
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setShowSortDropdown(false);
  };

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
    <div className="flex flex-col h-screen w-full">
      <div className="px-6 w-full">
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-5">전체 내 이벤트</h2>
      </div>
      <section className="border-t border-x border-b border-gray-200 bg-white px-0 pt-0 pb-0 shadow-sm w-full max-w-none flex-shrink-0">
        <div className="w-full max-w-none">
          <ManageFilter
            searchName={searchName}
            searchDate={searchDate}
            onSearchNameChange={setSearchName}
            onSearchDateChange={setSearchDate}
            onReset={() => {
              setSearchName('');
              setSearchDate('');
            }}
          />

          <ManageTabs
            activeTab={activeTab}
            sortOption={sortOption}
            statusCounts={statusCounts}
            showSortDropdown={showSortDropdown}
            selectedEventIds={selectedEventIds}
            onTabChange={setActiveTab}
            onSortChange={handleSortChange}
            onShowSortDropdownChange={setShowSortDropdown}
            onBulkDelete={handleBulkDeleteClick}
            deletingBulk={deletingBulk}
          />
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-lg hover:bg-blue-50 transition-colors font-bold border border-gray-200"
            style={{ color: '#4D82F3' }}
          >
            <span>이벤트 생성하기</span>
            <svg width="20" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24.0243 14.7833C24.0243 14.5383 24.1216 14.3032 24.2949 14.1299C24.4682 13.9567 24.7032 13.8593 24.9483 13.8593C25.1934 13.8593 25.4284 13.9567 25.6017 14.1299C25.7749 14.3032 25.8723 14.5383 25.8723 14.7833V24.9473C25.8723 25.1924 25.7749 25.4274 25.6017 25.6007C25.4284 25.774 25.1934 25.8713 24.9483 25.8713H4.62029C4.37523 25.8713 4.14021 25.774 3.96692 25.6007C3.79364 25.4274 3.69629 25.1924 3.69629 24.9473V4.61931C3.69629 4.37425 3.79364 4.13923 3.96692 3.96595C4.14021 3.79266 4.37523 3.69531 4.62029 3.69531H14.7843C15.0294 3.69531 15.2644 3.79266 15.4377 3.96595C15.6109 4.13923 15.7083 4.37425 15.7083 4.61931C15.7083 4.86437 15.6109 5.0994 15.4377 5.27268C15.2644 5.44596 15.0294 5.54331 14.7843 5.54331H5.54429V24.0233H24.0243V14.7833Z" fill="#4D82F3"/>
              <path d="M13.5702 16.0027L15.0948 15.7846L24.4605 6.42077C24.5487 6.33553 24.6191 6.23358 24.6676 6.12084C24.716 6.00811 24.7415 5.88686 24.7425 5.76418C24.7436 5.64149 24.7202 5.51982 24.6738 5.40626C24.6273 5.2927 24.5587 5.18954 24.472 5.10278C24.3852 5.01602 24.282 4.94741 24.1685 4.90095C24.0549 4.8545 23.9332 4.83112 23.8106 4.83218C23.6879 4.83325 23.5666 4.85874 23.4539 4.90716C23.3412 4.95559 23.2392 5.02598 23.154 5.11423L13.7864 14.4781L13.5684 16.0027H13.5702ZM25.767 3.80585C26.0246 4.06328 26.229 4.36894 26.3684 4.70537C26.5078 5.0418 26.5796 5.4024 26.5796 5.76658C26.5796 6.13075 26.5078 6.49136 26.3684 6.82779C26.229 7.16422 26.0246 7.46988 25.767 7.72731L16.1852 17.3092C16.0439 17.451 15.8603 17.5431 15.6622 17.5716L12.613 18.0077C12.4709 18.0281 12.326 18.0152 12.1897 17.9698C12.0535 17.9245 11.9298 17.848 11.8283 17.7465C11.7267 17.645 11.6503 17.5212 11.6049 17.385C11.5596 17.2488 11.5466 17.1039 11.567 16.9618L12.0031 13.9126C12.0311 13.7146 12.1226 13.5311 12.2637 13.3896L21.8474 3.8077C22.3673 3.28803 23.0722 2.99609 23.8072 2.99609C24.5423 2.99609 25.2472 3.28803 25.767 3.8077V3.80585Z" fill="#4D82F3"/>
            </svg>
          </Link>
        </div>
      ) : (
        <ManageTable
          filteredEvents={filteredEvents}
          selectedEventIds={selectedEventIds}
          selectAll={selectAll}
          baseUrl={baseUrl}
          onSelectAll={handleSelectAll}
          onSelectEvent={handleSelectEvent}
          onOpenQRModal={handleOpenQRModal}
        />
      )}

      <QRModal
        selectedEvent={selectedEvent}
        qrCodes={qrCodes}
        qrLoading={qrLoading}
        qrModalType={qrModalType}
        selectedSizes={selectedSizes}
        selectedFormats={selectedFormats}
        sizeSelectMode={sizeSelectMode}
        onClose={handleCloseQRModal}
        onPrintClick={handlePrintClick}
        onSaveClick={handleSaveClick}
        onSizeConfirm={handleSizeConfirm}
        onSizeCancel={handleSizeCancel}
        onSizeChange={(index, size) => {
          setSelectedSizes(prev => ({
            ...prev,
            [index]: size,
          }));
        }}
        onFormatChange={(index, format) => {
          setSelectedFormats(prev => ({
            ...prev,
            [index]: format,
          }));
        }}
      />

      <DeleteModals
        showBulkDeleteConfirm={showBulkDeleteConfirm}
        showDeleteConfirm={showDeleteConfirm}
        selectedEventIds={selectedEventIds}
        deletingBulk={deletingBulk}
        deletingEventId={deletingEventId}
        onBulkDeleteConfirm={handleBulkDeleteConfirm}
        onBulkDeleteCancel={handleBulkDeleteCancel}
        onDeleteConfirm={handleDeleteConfirm}
        onDeleteCancel={handleDeleteCancel}
      />
      </section>
    </div>
  );
}



