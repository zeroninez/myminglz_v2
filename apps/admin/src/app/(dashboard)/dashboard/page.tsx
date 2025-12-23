'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  name: string;
  domain_code: string;
  start_date: string;
  end_date: string;
  created_at: string;
  user_id?: string; // 관리자용
  userEmail?: string; // 클라이언트에서 추가
}

interface User {
  id: string;
  email: string;
  role: string;
}

interface EventStats {
  id: string;
  name: string;
  domainCode: string;
  userId: string;
  conversionRate: number;
  totalInflow: number;
  couponIssued: number;
  couponUsed: number;
}

interface UserStats {
  userId: string;
  userEmail?: string; // 사용자 이메일
  eventCount: number;
  totalInflow: number;
  totalCouponIssued: number;
  totalCouponUsed: number;
  avgConversionRate: number;
  events: EventStats[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null); // null로 초기화하여 로딩 상태 확인
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    // 현재 사용자 정보 확인
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          const role = data.user.role || 'user';
          const email = data.user.email || '';
          // 관리자 체크: role이 'admin'이거나 이메일이 admin@zeroninez.com인 경우
          const isAdmin = role === 'admin' || email === 'admin@zeroninez.com';
          setUserRole(isAdmin ? 'admin' : 'user');
          
          // 관리자가 아니면 일반 대시보드로 리다이렉트
          if (!isAdmin) {
            router.replace('/create');
          }
        } else {
          setUserRole('user');
        }
      })
      .catch(() => {
        setUserRole('user');
      });
  }, [router]);

  // 이벤트 조회 함수 메모이제이션
  const fetchAllEvents = useCallback(async () => {
    if (userRole !== 'admin') return;

    try {
      setEventsLoading(true);
      const response = await fetch('/api/events?all=true', {
        cache: 'no-store',
      });
      const result = await response.json();

      if (result.success) {
        // API에서 이미 이메일이 포함되어 있으면 그대로 사용
        const eventsData = result.data || [];
        setEvents(eventsData);
      }
    } catch (err) {
      console.error('이벤트 목록 로드 오류:', err);
    } finally {
      setEventsLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchAllEvents();
    }
  }, [userRole, fetchAllEvents]);

  useEffect(() => {
    // 모든 사용자 조회 (관리자 권한 - 나중에 API 추가 필요)
    // 지금은 임시로 빈 배열
    setUsersLoading(false);
  }, []);

  // 모든 계정별 통계 조회
  useEffect(() => {
    const fetchAllUserStats = async () => {
      if (userRole !== 'admin') return;

      try {
        setStatsLoading(true);
        
        // 1. 병렬로 사용자 목록과 통계 데이터 동시 조회
        const [usersResponse, statsResponse] = await Promise.all([
          fetch('/api/users/list', { cache: 'no-store' }),
          fetch('/api/stats?all=true&period=all', { cache: 'no-store' }),
        ]);
        
        const [usersResult, result] = await Promise.all([
          usersResponse.json(),
          statsResponse.json(),
        ]);
        
        const allUsers = usersResult.success ? usersResult.data : [];
        console.log('전체 사용자 목록:', allUsers);

        console.log('통계 API 응답:', result);
        
        // 모든 사용자로 초기화 (이벤트가 없는 계정도 포함)
        const statsByUser = new Map<string, UserStats>();
        allUsers.forEach((user: { id: string; email: string }) => {
          statsByUser.set(user.id, {
            userId: user.id,
            userEmail: user.email,
            eventCount: 0,
            totalInflow: 0,
            totalCouponIssued: 0,
            totalCouponUsed: 0,
            avgConversionRate: 0,
            events: [],
          });
        });
        
        if (result.success && result.data?.events) {
          console.log('이벤트 개수:', result.data.events.length);
          
          // 이벤트가 있는 사용자의 통계 업데이트
          result.data.events.forEach((event: any) => {
            // userId 필드 확인 (대소문자 구분)
            const userId = event.userId || event.user_id;
            console.log('이벤트:', event.name, 'userId:', userId, 'totalInflow:', event.totalInflow);
            
            // userId가 없으면 스킵
            if (!userId) {
              console.warn('userId가 없는 이벤트 스킵:', event.name, event.id);
              return;
            }
            
            // 사용자가 없으면 추가
            if (!statsByUser.has(userId)) {
              statsByUser.set(userId, {
                userId,
                eventCount: 0,
                totalInflow: 0,
                totalCouponIssued: 0,
                totalCouponUsed: 0,
                avgConversionRate: 0,
                events: [],
              });
            }

            const userStat = statsByUser.get(userId)!;
            userStat.eventCount += 1;
            userStat.totalInflow += event.totalInflow || 0;
            userStat.totalCouponIssued += event.couponIssued || 0;
            userStat.totalCouponUsed += event.couponUsed || 0;
            userStat.events.push(event);
          });

          // 평균 전환율 계산
          statsByUser.forEach((userStat) => {
            const totalIssued = userStat.totalCouponIssued;
            if (totalIssued > 0) {
              userStat.avgConversionRate = Math.round((userStat.totalCouponUsed / totalIssued) * 100 * 100) / 100;
            }
          });

          const finalStats = Array.from(statsByUser.values());
          console.log('최종 통계:', finalStats);
          
          // 이메일이 아직 없는 사용자들만 조회
          const usersWithoutEmail = finalStats.filter(stat => !stat.userEmail).map(stat => stat.userId);
          console.log('이메일이 없는 사용자 ID 목록:', usersWithoutEmail);
          
          if (usersWithoutEmail.length > 0) {
            try {
              const emailResponse = await fetch('/api/users/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userIds: usersWithoutEmail }),
              });
              const emailResult = await emailResponse.json();
              
              console.log('이메일 조회 응답:', emailResult);
              
              if (emailResult.success && emailResult.data) {
                // 각 통계에 이메일 추가
                finalStats.forEach(stat => {
                  if (!stat.userEmail && emailResult.data[stat.userId]) {
                    stat.userEmail = emailResult.data[stat.userId];
                    console.log(`사용자 ${stat.userId} 이메일 추가: ${stat.userEmail}`);
                  }
                });
              } else {
                console.error('이메일 조회 실패:', emailResult.error);
              }
            } catch (err) {
              console.error('사용자 이메일 조회 오류:', err);
            }
          }
          
          setUserStats(finalStats);
        } else {
          console.error('통계 API 실패:', result);
        }
      } catch (err) {
        console.error('통계 데이터 로드 오류:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    if (userRole === 'admin') {
      fetchAllUserStats();
    }
  }, [userRole]);

  // 세션 확인 중
  if (userRole === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">로딩 중...</span>
      </div>
    );
  }

  // 관리자가 아닌 경우
  if (userRole !== 'admin') {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">관리자 권한이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">전체 관리자 대시보드</h2>
        <p className="mt-2 text-gray-600">모든 이벤트와 사용자를 관리할 수 있습니다.</p>
      </div>

      {/* 이벤트 현황 */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">이벤트 현황</h3>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            총 {events.length}개
          </span>
        </div>

        {eventsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : events.length === 0 ? (
          <p className="text-gray-500">등록된 이벤트가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    이벤트명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    계정
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    도메인 코드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {event.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {event.userEmail || '(이메일 정보 없음)'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {event.domain_code}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(event.start_date).toLocaleDateString()} ~{' '}
                      {new Date(event.end_date).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(event.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <button
                        onClick={() => router.push(`/create/${event.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 계정별 통계 */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">계정별 통계</h3>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            총 {userStats.length}개 계정
          </span>
        </div>

        {statsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : userStats.length === 0 ? (
          <p className="text-gray-500">통계 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {userStats.map((stat) => {
              // 이벤트가 없는 계정도 표시하되, 통계는 0으로 표시
              return (
                <div key={stat.userId} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {stat.userEmail || stat.userId || '알 수 없음'}
                    </h4>
                    {stat.userEmail && stat.userId && (
                      <p className="text-xs text-gray-500 mt-1">ID: {stat.userId}</p>
                    )}
                    {!stat.userEmail && stat.userId && (
                      <p className="text-xs text-gray-400 mt-1">(이메일 정보 없음)</p>
                    )}
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                    {stat.eventCount}개 이벤트
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <div className="text-xs text-gray-500">평균 전환율</div>
                    <div className="text-lg font-semibold text-gray-900">{stat.avgConversionRate}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">총 유입 수</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {stat.totalInflow.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">총 쿠폰 발급</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {stat.totalCouponIssued.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">총 쿠폰 사용</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {stat.totalCouponUsed.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 이벤트별 상세 통계 */}
                {stat.events.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                        이벤트별 상세 ({stat.events.length}개)
                      </summary>
                      <div className="mt-2 space-y-2">
                        {stat.events.map((event) => (
                          <div
                            key={event.id}
                            className="rounded border border-gray-200 bg-gray-50 p-3 text-sm"
                          >
                            <div className="mb-2 font-medium text-gray-900">{event.name}</div>
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                              <div>
                                <span className="text-gray-500">전환율:</span>{' '}
                                <span className="font-medium">{event.conversionRate}%</span>
                              </div>
                              <div>
                                <span className="text-gray-500">유입:</span>{' '}
                                <span className="font-medium">{event.totalInflow.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">발급:</span>{' '}
                                <span className="font-medium">{event.couponIssued.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">사용:</span>{' '}
                                <span className="font-medium">{event.couponUsed.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
