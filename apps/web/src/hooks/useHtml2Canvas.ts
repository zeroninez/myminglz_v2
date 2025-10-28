import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';

interface UseHtml2CanvasOptions {
  quality?: number;
  scale?: number;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useHtml2Canvas(options: UseHtml2CanvasOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const captureElement = useCallback(async (element: HTMLElement) => {
    if (!element) return null;

    try {
      setLoading(true);
      setError(null);

      const canvas = await html2canvas(element, {
        scale: options.scale || window.devicePixelRatio || 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        removeContainer: true,
        foreignObjectRendering: false,
        imageTimeout: 0,
        ignoreElements: (element: Element) => {
          return element.tagName === 'IFRAME' || element.tagName === 'SCRIPT';
        },
        onclone: (doc: Document) => {
          const styles = Array.from(document.styleSheets);
          const newStyles = doc.createElement('style');
          styles.forEach(styleSheet => {
            try {
              const cssRules = Array.from(styleSheet.cssRules);
              cssRules.forEach(rule => {
                newStyles.textContent += rule.cssText + '\n';
              });
            } catch (e) {
              console.warn('Style copy error:', e);
            }
          });
          doc.head.appendChild(newStyles);
          return doc;
        }
      });

      const url = canvas.toDataURL('image/png', options.quality || 1.0);
      setImageUrl(url);
      options.onSuccess?.(url);

      return url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('이미지 생성 중 오류가 발생했습니다.');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    captureElement,
    loading,
    error,
    imageUrl,
  };
}