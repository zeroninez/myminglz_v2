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
    
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    if (now < startDate) return 'waiting';
    if (now > endDate) return 'ended';
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
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            이벤트 생성하기
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



