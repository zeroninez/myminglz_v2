'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface Event {
  id: string;
  name: string;
  domain_code: string;
  start_date: string | null;
  end_date: string | null;
  background_color: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  userEmail?: string;
  status?: string;
  event_info_config?: {
    stores?: Array<{ id?: string; name: string }>;
  } | null;
}

interface EventsContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetched: number | null;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchEvents = useCallback(async (forceRefresh = false) => {
    // 5분 이내에 가져온 데이터가 있고 강제 새로고침이 아닌 경우 캐시된 데이터 사용
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (!forceRefresh && lastFetched && lastFetched > fiveMinutesAgo && events.length > 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/events', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const result = await response.json();

      if (!result.success) {
        setError(result.error || '이벤트 목록을 불러올 수 없습니다.');
        return;
      }

      const eventsData = Array.isArray(result.data) ? result.data : [];
      setEvents(eventsData);
      setLastFetched(Date.now());
    } catch (err: any) {
      console.error('이벤트 목록 로드 오류:', err);
      setError('이벤트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [lastFetched, events.length]);

  const refetch = useCallback(async (forceRefresh = false) => {
    await fetchEvents(forceRefresh);
  }, [fetchEvents]);

  // 초기 로드 (한 번만 실행)
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EventsContext.Provider value={{ events, loading, error, refetch, lastFetched }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}

