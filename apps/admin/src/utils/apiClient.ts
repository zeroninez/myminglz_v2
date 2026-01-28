interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private async makeRequest(url: string, options: ApiOptions = {}): Promise<Response> {
    const { skipAuth = false, ...fetchOptions } = options;
    
    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    };

    let response = await fetch(url, config);

    // 401 오류이고 인증이 필요한 요청인 경우 세션 갱신 시도
    if (response.status === 401 && !skipAuth) {
      try {
        // 세션 갱신 시도
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });

        if (sessionResponse.ok) {
          const sessionResult = await sessionResponse.json();
          if (sessionResult.success) {
            // 세션 갱신 성공, 원래 요청 재시도
            response = await fetch(url, config);
          } else {
            // 세션 갱신 실패, 로그인 페이지로 리다이렉트
            window.location.href = '/login';
            return response;
          }
        } else {
          // 세션 갱신 실패, 로그인 페이지로 리다이렉트
          window.location.href = '/login';
          return response;
        }
      } catch (error) {
        console.error('세션 갱신 오류:', error);
        window.location.href = '/login';
        return response;
      }
    }

    return response;
  }

  async get(url: string, options?: ApiOptions): Promise<Response> {
    return this.makeRequest(url, { ...options, method: 'GET' });
  }

  async post(url: string, data?: any, options?: ApiOptions): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(url: string, data?: any, options?: ApiOptions): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(url: string, options?: ApiOptions): Promise<Response> {
    return this.makeRequest(url, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

// 편의 함수들
export async function apiGet(url: string, options?: ApiOptions) {
  return apiClient.get(url, options);
}

export async function apiPost(url: string, data?: any, options?: ApiOptions) {
  return apiClient.post(url, data, options);
}

export async function apiPut(url: string, data?: any, options?: ApiOptions) {
  return apiClient.put(url, data, options);
}

export async function apiDelete(url: string, options?: ApiOptions) {
  return apiClient.delete(url, options);
}