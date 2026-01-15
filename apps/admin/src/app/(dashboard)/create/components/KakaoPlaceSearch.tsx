'use client';

import { useState, useEffect, useRef } from 'react';

export interface Place {
  id: string;
  placeName: string;
  addressName: string;
  roadAddressName: string;
  categoryName: string;
  phone: string;
  x: string; // 경도
  y: string; // 위도
  placeUrl: string;
}

interface KakaoPlaceSearchProps {
  value?: string;
  onSelect: (place: Place) => void;
  placeholder?: string;
  className?: string;
}

export default function KakaoPlaceSearch({
  value = '',
  onSelect,
  placeholder = '장소를 검색해주세요.',
  className = '',
}: KakaoPlaceSearchProps) {
  const [query, setQuery] = useState(value);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // value prop이 변경되면 query state 업데이트
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 검색 API 호출
  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setPlaces([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/kakao/places?query=${encodeURIComponent(searchQuery.trim())}`);
      const result = await response.json();

      if (result.success) {
        setPlaces(result.data || []);
        setIsOpen(result.data && result.data.length > 0);
      } else {
        console.error('장소 검색 실패:', result.error);
        setPlaces([]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('장소 검색 오류:', error);
      setPlaces([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // 입력값 변경 시 debounce 적용
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // 선택된 장소가 있으면 초기화
    if (selectedPlace) {
      setSelectedPlace(null);
    }

    // 기존 timeout 제거
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 300ms 후에 검색 실행
    searchTimeoutRef.current = setTimeout(() => {
      if (newQuery.trim()) {
        searchPlaces(newQuery);
      } else {
        setPlaces([]);
        setIsOpen(false);
      }
    }, 300);
  };

  // 장소 선택
  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place);
    setQuery(place.placeName);
    setIsOpen(false);
    onSelect(place);
  };

  // 입력 필드 포커스
  const handleFocus = () => {
    if (query.trim() && places.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full h-12 px-4 pr-10 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && places.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-64 overflow-y-auto">
          {places.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => handleSelectPlace(place)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900">{place.placeName}</div>
              <div className="text-xs text-gray-500 mt-1">
                {place.roadAddressName || place.addressName}
              </div>
              {place.categoryName && (
                <div className="text-xs text-gray-400 mt-0.5">{place.categoryName}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

