export const useCouponStorage = () => {
  const saveToLocal = (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  };

  const saveToSession = (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, value);
    }
  };

  const getFromLocal = (key: string) => {
    if (typeof window !== 'undefined') {
      if (key === 'couponData') {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }
      return localStorage.getItem(key);
    }
    return null;
  };

  const getFromSession = (key: string) => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(key);
    }
    return null;
  };

  return {
    saveToLocal,
    saveToSession,
    getFromLocal,
    getFromSession
  };
};
