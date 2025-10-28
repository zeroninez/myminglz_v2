interface Window {
  Kakao: {
    init: (key: string) => void;
    isInitialized: () => boolean;
    Share: {
      sendDefault: (options: any) => void;
    };
  };
}
