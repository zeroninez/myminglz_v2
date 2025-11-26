'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeService } from '@myminglz/core/src/utils/qr';
import { QR_SIZES, IMAGE_FORMATS, type QRSize, type ImageFormat, type QRCodeData, printQRCode, saveQRCode } from './utils/qrPrint';

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

export default function ManagePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<number, QRSize>>({});
  const [selectedFormats, setSelectedFormats] = useState<Record<number, ImageFormat>>({});
  const [sizeSelectMode, setSizeSelectMode] = useState<Record<number, 'print' | 'save' | null>>({});

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/events');
        const result = await response.json();

        if (!result.success) {
          setError(result.error || '이벤트 목록을 불러올 수 없습니다.');
          return;
        }

        setEvents(result.data || []);
      } catch (err: any) {
        console.error('이벤트 목록 로드 오류:', err);
        setError('이벤트 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://myminglz-v2-web.vercel.app';

  // QR 코드 모달 열기
  const handleOpenQRModal = async (event: Event) => {
    setSelectedEvent(event);
    setQrLoading(true);
    setQrCodes([]);

    try {
      const qrCodeList: QRCodeData[] = [];
      
      // 도메인 주소 QR 코드 생성
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
        label: '도메인 주소',
        url: eventUrl,
        qrCodeUrl: eventQRCode,
      });

      // 사용처별 QR 코드 생성
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
            label: store.name || '사용처',
            url: verifyUrl,
            qrCodeUrl: storeQRCode,
          });
        }
      }

      setQrCodes(qrCodeList);
    } catch (err) {
      console.error('QR 코드 생성 오류:', err);
      setError('QR 코드 생성 중 오류가 발생했습니다.');
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

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-10 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">관리</h2>
        <p className="mt-2 text-gray-600">
          생성된 이벤트 목록과 URL을 관리하는 영역입니다.
        </p>
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
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">생성된 이벤트가 없습니다.</p>
          <Link
            href="/create"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            이벤트 생성하기
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이벤트 이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이벤트 기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  도메인 주소
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용처
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => {
                const eventUrl = `${baseUrl}/${event.domain_code}`;
                // stores가 배열인지 확인하고 유효한 항목만 필터링
                const stores = Array.isArray(event.event_info_config?.stores) 
                  ? event.event_info_config.stores.filter((store: any) => store && store.name)
                  : [];
                const storeCount = stores.length;
                let storeDisplay = '사용처 없음';
                if (storeCount > 0) {
                  const firstStore = stores[0]?.name || '';
                  if (storeCount === 1) {
                    storeDisplay = firstStore;
                  } else {
                    storeDisplay = `${firstStore} 외 ${storeCount - 1}곳`;
                  }
                }
                
                return (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {event.start_date && event.end_date
                          ? `${new Date(event.start_date).toLocaleDateString('ko-KR')} ~ ${new Date(event.end_date).toLocaleDateString('ko-KR')}`
                          : '기간 미설정'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <a
                          href={eventUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {eventUrl}
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(eventUrl);
                            alert('URL이 클립보드에 복사되었습니다.');
                          }}
                          className="text-gray-400 hover:text-gray-600"
                          title="URL 복사"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {storeDisplay}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleOpenQRModal(event)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        코드 인쇄
                      </button>
                      <Link
                        href={`/create/${event.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        수정
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* QR 코드 인쇄 모달 */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedEvent.name} - QR 코드 인쇄
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
    </section>
  );
}



