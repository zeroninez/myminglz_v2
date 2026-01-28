// Redis 기반 통계 캐싱 시스템
interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
}

class StatsCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  // 캐시 키 생성
  private generateKey(eventId: string | null, period: string, dateRange?: { start: string; end: string }): string {
    const base = `stats:${eventId || 'all'}:${period}`;
    if (dateRange) {
      return `${base}:${dateRange.start}:${dateRange.end}`;
    }
    return base;
  }

  // 캐시 TTL 결정 (데이터 특성에 따라)
  private getTTL(period: string): number {
    switch (period) {
      case 'today':
        return 5 * 60; // 5분 (실시간성 중요)
      case 'yesterday':
        return 60 * 60; // 1시간 (변경 가능성 낮음)
      case 'weekly':
        return 30 * 60; // 30분
      case 'monthly':
        return 60 * 60; // 1시간
      case 'all':
        return 2 * 60 * 60; // 2시간 (전체 데이터는 자주 변경되지 않음)
      default:
        return 10 * 60; // 10분
    }
  }

  // 캐시에서 데이터 조회
  get(eventId: string | null, period: string, dateRange?: { start: string; end: string }): any | null {
    const key = this.generateKey(eventId, period, dateRange);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // 캐시에 데이터 저장
  set(eventId: string | null, period: string, data: any, dateRange?: { start: string; end: string }): void {
    const key = this.generateKey(eventId, period, dateRange);
    const ttl = this.getTTL(period);
    const expiry = Date.now() + (ttl * 1000);
    
    this.cache.set(key, { data, expiry });
  }

  // 특정 이벤트의 캐시 무효화
  invalidateEvent(eventId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(`stats:${eventId}:`) || key.includes('stats:all:')
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // 전체 캐시 무효화
  clear(): void {
    this.cache.clear();
  }

  // 캐시 상태 조회
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const statsCache = new StatsCache();

// 캐시를 활용한 통계 조회 함수
export async function getCachedStats(
  eventId: string | null,
  period: string,
  dateRange?: { start: string; end: string },
  fetchFunction?: () => Promise<any>
): Promise<any> {
  // 캐시에서 조회
  const cached = statsCache.get(eventId, period, dateRange);
  if (cached) {
    console.log('캐시에서 통계 데이터 조회:', { eventId, period });
    return cached;
  }

  // 캐시 미스 시 실제 데이터 조회
  if (fetchFunction) {
    console.log('DB에서 통계 데이터 조회:', { eventId, period });
    const data = await fetchFunction();
    
    // 캐시에 저장
    statsCache.set(eventId, period, data, dateRange);
    return data;
  }

  return null;
}

// 백그라운드 캐시 워밍 (자주 사용되는 데이터 미리 로드)
export async function warmupCache(eventIds: string[], fetchFunction: (eventId: string, period: string) => Promise<any>) {
  const periods = ['today', 'yesterday', 'weekly', 'all'];
  const promises = [];

  for (const eventId of eventIds) {
    for (const period of periods) {
      promises.push(
        fetchFunction(eventId, period).then(data => {
          statsCache.set(eventId, period, data);
        }).catch(err => {
          console.warn(`캐시 워밍 실패: ${eventId}:${period}`, err);
        })
      );
    }
  }

  // 전체 통계도 워밍
  for (const period of periods) {
    promises.push(
      fetchFunction('all', period).then(data => {
        statsCache.set(null, period, data);
      }).catch(err => {
        console.warn(`전체 통계 캐시 워밍 실패: ${period}`, err);
      })
    );
  }

  await Promise.allSettled(promises);
  console.log(`캐시 워밍 완료: ${promises.length}개 항목`);
}