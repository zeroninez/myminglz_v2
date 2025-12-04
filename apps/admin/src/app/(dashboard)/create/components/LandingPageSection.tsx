'use client';

import { ChangeEvent, useEffect, useMemo, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import PhoneFrame from '../templates/components/PhoneFrame';
import {
  type TemplateCategory,
  type TemplateVariant,
  type TemplateField,
  templateCategories,
  templateVariants,
  templateComponentMap,
  colorPalette,
  templateFieldConfigs,
  templateDefaultValues,
  getDefaultSelectionForPage,
} from '../config/templateConfig';

// 기본 배경색
const DEFAULT_BACKGROUND_COLOR = '#000000';

interface LandingPageSectionProps {
  initialData?: {
    pageSelections: Record<number, { pageType: string; templateType: string }>;
    pageBackgroundColors: Record<number, string>;
    designValues: Record<number, Record<string, string>>;
  };
  onDataChange?: (data: {
    pageSelections: Record<number, { pageType: string; templateType: string }>;
    pageBackgroundColors: Record<number, string>;
    designValues: Record<number, Record<string, string>>;
  }) => void;
}

export interface LandingPageSectionRef {
  uploadPendingImages: () => Promise<{ success: boolean; updatedData?: {
    pageSelections: Record<number, { pageType: string; templateType: string }>;
    pageBackgroundColors: Record<number, string>;
    designValues: Record<number, Record<string, string>>;
  } }>;
}

const LandingPageSection = forwardRef<LandingPageSectionRef, LandingPageSectionProps>(
  ({ initialData, onDataChange }, ref) => {
  const [activeTab, setActiveTab] = useState<'type' | 'design'>('type');
  const [selectedPage, setSelectedPage] = useState(1);
  
  // initialData에서 페이지 정보 추출
  const getInitialPages = () => {
    if (initialData?.pageSelections) {
      const pageNumbers = Object.keys(initialData.pageSelections)
        .map(Number)
        .sort((a, b) => a - b);
      return pageNumbers.map((num) => ({ id: num, label: `Page ${num}` }));
    }
    return [{ id: 1, label: 'Page 1' }];
  };

  // 동적 페이지 관리
  const [pages, setPages] = useState<Array<{ id: number; label: string }>>(getInitialPages);
  const [pageSelections, setPageSelections] = useState<
    Record<number, { pageType: TemplateCategory; templateType: TemplateVariant }>
  >(() => {
    if (initialData?.pageSelections) {
      const result: Record<number, { pageType: TemplateCategory; templateType: TemplateVariant }> = {};
      Object.entries(initialData.pageSelections).forEach(([key, value]) => {
        result[Number(key)] = {
          pageType: value.pageType as TemplateCategory,
          templateType: value.templateType as TemplateVariant,
        };
      });
      return result;
    }
    return { 1: getDefaultSelectionForPage(1) };
  });
  // 전역 배경색 상태 (모든 페이지에 동일하게 적용)
  const [globalBackgroundColor, setGlobalBackgroundColor] = useState<string>(() => {
    // initialData에서 첫 번째 페이지의 배경색을 가져오거나 기본값 사용
    if (initialData?.pageBackgroundColors) {
      const firstColor = Object.values(initialData.pageBackgroundColors)[0];
      return firstColor || DEFAULT_BACKGROUND_COLOR;
    }
    return DEFAULT_BACKGROUND_COLOR;
  });
  const [designValues, setDesignValues] = useState<Record<number, Record<string, string>>>(() => {
    if (initialData?.designValues) {
      return initialData.designValues;
    }
    return { 1: templateDefaultValues['표지']?.['유형1'] ?? {} };
  });
  
  // 이미지 파일 객체 저장 (페이지 ID + 필드 ID 조합으로 키 생성)
  const [pendingImageFiles, setPendingImageFiles] = useState<Record<string, File>>({});

  // initialData가 변경되면 상태 업데이트
  useEffect(() => {
    if (initialData) {
      const newPages = getInitialPages();
      setPages(newPages);
      
      if (initialData.pageSelections) {
        const result: Record<number, { pageType: TemplateCategory; templateType: TemplateVariant }> = {};
        Object.entries(initialData.pageSelections).forEach(([key, value]) => {
          result[Number(key)] = {
            pageType: value.pageType as TemplateCategory,
            templateType: value.templateType as TemplateVariant,
          };
        });
        setPageSelections(result);
      }
      
      // 전역 배경색 초기화
      if (initialData.pageBackgroundColors) {
        const firstColor = Object.values(initialData.pageBackgroundColors)[0];
        if (firstColor) {
          setGlobalBackgroundColor(firstColor);
        }
      }
      
      if (initialData.designValues) {
        setDesignValues(initialData.designValues);
      }
      
      // 첫 번째 페이지 선택
      if (newPages.length > 0) {
        setSelectedPage(newPages[0].id);
      }
    }
  }, [initialData]);

  // 데이터 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (onDataChange) {
      // 모든 페이지에 전역 배경색 적용
      const allPagesBackgroundColors: Record<number, string> = {};
      pages.forEach((page) => {
        allPagesBackgroundColors[page.id] = globalBackgroundColor;
      });
      
      onDataChange({
        pageSelections: pageSelections as Record<number, { pageType: string; templateType: string }>,
        pageBackgroundColors: allPagesBackgroundColors,
        designValues,
      });
    }
  }, [pageSelections, designValues, pages, globalBackgroundColor, onDataChange]);

  const selectedPageLabel = useMemo(() => {
    const found = pages.find((page) => page.id === selectedPage);
    return found ? found.label : `Page ${selectedPage}`;
  }, [pages, selectedPage]);

  const currentSelection = useMemo(() => {
    return (
      pageSelections[selectedPage] ?? {
        ...getDefaultSelectionForPage(selectedPage),
      }
    );
  }, [pageSelections, selectedPage]);

  const { pageType, templateType } = currentSelection;

  const availableTemplateVariants = useMemo(
    () => templateVariants.filter((variant) => !!templateComponentMap[pageType]?.[variant]),
    [pageType]
  );

  // 모든 페이지에 동일한 페이지 유형 옵션 제공
  const availableTemplateCategories = useMemo(() => {
    return templateCategories;
  }, []);

  const SelectedTemplate = templateComponentMap[pageType]?.[templateType];
  const currentFields = templateFieldConfigs[pageType]?.[templateType] ?? [];

  const currentDefaultValues = useMemo(
    () => templateDefaultValues[pageType]?.[templateType] ?? {},
    [pageType, templateType]
  );

  const currentDesignValues = useMemo(() => {
    const existing = designValues[selectedPage];
    if (!existing) {
      return currentDefaultValues;
    }
    return { ...currentDefaultValues, ...existing };
  }, [designValues, selectedPage, currentDefaultValues]);

  // 전역 배경색 사용 (모든 페이지에 동일)
  const currentBackgroundColor = globalBackgroundColor;
  
  // 전역 배경색 변경 핸들러 (모든 페이지에 동일하게 적용)
  const handleBackgroundColorChange = (color: string) => {
    setGlobalBackgroundColor(color);
  };

  const isTemplateAvailable = !!SelectedTemplate && currentFields.length > 0;

  useEffect(() => {
    if (!isTemplateAvailable) return;
    setDesignValues((prev) => {
      const existing = prev[selectedPage] ?? {};
      const merged = { ...currentDefaultValues, ...existing };
      return { ...prev, [selectedPage]: merged };
    });
  }, [selectedPage, pageType, templateType, currentDefaultValues, isTemplateAvailable]);

  const handleDesignChange = (fieldId: string, value: string) => {
    setDesignValues((prev) => ({
      ...prev,
      [selectedPage]: {
        ...currentDefaultValues,
        ...prev[selectedPage],
        [fieldId]: value,
      },
    }));
  };

  const handleColorChange = (fieldId: string, color: string) => {
    const colorFieldId = `${fieldId}Color`;
    setDesignValues((prev) => ({
      ...prev,
      [selectedPage]: {
        ...currentDefaultValues,
        ...prev[selectedPage],
        [colorFieldId]: color,
      },
    }));
  };

  const handleVisibilityToggle = (fieldId: string, isVisible: boolean) => {
    const visibilityFieldId = `${fieldId}Visible`;
    setDesignValues((prev) => ({
      ...prev,
      [selectedPage]: {
        ...currentDefaultValues,
        ...prev[selectedPage],
        [visibilityFieldId]: isVisible ? 'true' : 'false',
      },
    }));
  };

  // 이미지 선택 시 로컬 미리보기만 표시
  const handleImageSelect = (fieldId: string, file: File) => {
    // 로컬 미리보기 URL 생성
    const previewUrl = URL.createObjectURL(file);
    
    // File 객체 저장 (완료 시 업로드용)
    const fileKey = `${selectedPage}-${fieldId}`;
    setPendingImageFiles((prev) => ({
      ...prev,
      [fileKey]: file,
    }));
    
    // 로컬 URL로 미리보기 설정
    handleDesignChange(fieldId, previewUrl);
  };

  // 완료 시점에 모든 대기 중인 이미지를 Storage에 업로드
  const uploadPendingImages = async (): Promise<{ success: boolean; updatedData?: any }> => {
    const uploadPromises: Promise<void>[] = [];
    const updatedDesignValues = JSON.parse(JSON.stringify(designValues)); // 깊은 복사
    
    // pendingImageFiles에 있는 파일들을 업로드
    for (const [fileKey, file] of Object.entries(pendingImageFiles)) {
      const [pageId, fieldId] = fileKey.split('-');
      const pageNum = Number(pageId);
      
      uploadPromises.push(
        (async () => {
          try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload-image', {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.success || !data.url) {
              throw new Error(data.error || '이미지 업로드 실패');
            }

            // 로컬 URL을 실제 Storage URL로 교체
            if (!updatedDesignValues[pageNum]) {
              updatedDesignValues[pageNum] = {};
            }
            
            const currentValue = updatedDesignValues[pageNum][fieldId] || '';
            if (currentValue.startsWith('blob:')) {
              // 로컬 URL인 경우에만 교체
              URL.revokeObjectURL(currentValue); // 메모리 해제
            }
            
            // Storage URL로 교체
            updatedDesignValues[pageNum][fieldId] = data.url;
          } catch (error: any) {
            console.error(`이미지 업로드 실패 (${fileKey}):`, error);
            throw error;
          }
        })()
      );
    }

    try {
      // 모든 이미지 업로드 완료 대기
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
        console.log('모든 이미지 업로드 완료');
      }
      
      // designValues에서 남아있는 blob URL 확인 및 제거
      let hasBlobUrls = false;
      Object.keys(updatedDesignValues).forEach((pageNum) => {
        Object.keys(updatedDesignValues[Number(pageNum)]).forEach((fieldId) => {
          const value = updatedDesignValues[Number(pageNum)][fieldId];
          if (typeof value === 'string' && value.startsWith('blob:')) {
            console.warn(`경고: blob URL이 남아있음 - 페이지 ${pageNum}, 필드 ${fieldId}`);
            hasBlobUrls = true;
            // blob URL 제거 (이미지가 업로드되지 않은 것으로 처리)
            updatedDesignValues[Number(pageNum)][fieldId] = '';
          }
        });
      });
      
      if (hasBlobUrls && Object.keys(pendingImageFiles).length === 0) {
        console.warn('경고: pendingImageFiles에 파일이 없지만 blob URL이 남아있습니다. 이미지를 다시 선택해주세요.');
      }
      
      // 업로드된 URL로 designValues 업데이트
      setDesignValues(updatedDesignValues);
      
      // 업로드 완료된 파일들 정리
      setPendingImageFiles({});
      
      // 업데이트된 전체 데이터 구성
      const allPagesBackgroundColors: Record<number, string> = {};
      pages.forEach((page) => {
        allPagesBackgroundColors[page.id] = globalBackgroundColor;
      });
      
      const updatedData = {
        pageSelections: pageSelections as Record<number, { pageType: string; templateType: string }>,
        pageBackgroundColors: allPagesBackgroundColors,
        designValues: updatedDesignValues,
      };
      
      // 부모 컴포넌트에 업데이트된 데이터 전달
      if (onDataChange) {
        onDataChange(updatedData);
      }
      
      return { success: true, updatedData };
    } catch (error: any) {
      console.error('이미지 업로드 중 오류:', error);
      alert(`이미지 업로드 중 오류가 발생했습니다: ${error?.message || error}`);
      return { success: false };
    }
  };

  // 배경색 변경 기능 제거됨 (전역 배경색 사용)

  // 부모 컴포넌트에서 이미지 업로드 함수 호출할 수 있도록 노출
  useImperativeHandle(ref, () => ({
    uploadPendingImages,
  }));

  // 컴포넌트 언마운트 시 로컬 URL 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      // 모든 로컬 URL 해제
      Object.values(designValues).forEach((pageValues) => {
        Object.values(pageValues).forEach((value) => {
          if (typeof value === 'string' && value.startsWith('blob:')) {
            URL.revokeObjectURL(value);
          }
        });
      });
    };
  }, []);

  useEffect(() => {
    setPageSelections((prev) => {
      if (prev[selectedPage]) {
        return prev;
      }
      return {
        ...prev,
        [selectedPage]: getDefaultSelectionForPage(selectedPage),
      };
    });
  }, [selectedPage]);

  // 배경색 설정 useEffect 제거됨 (전역 배경색 사용)

  const handlePageTypeChange = (nextType: TemplateCategory) => {
    setPageSelections((prev) => {
      const nextVariants = templateVariants.filter((variant) => !!templateComponentMap[nextType]?.[variant]);
      const fallbackVariant =
        nextVariants[0] ??
        prev[selectedPage]?.templateType ??
        getDefaultSelectionForPage(selectedPage).templateType;
      return {
        ...prev,
        [selectedPage]: {
          pageType: nextType,
          templateType: fallbackVariant,
        },
      };
    });
  };

  const handleTemplateTypeChange = (nextTemplateType: TemplateVariant) => {
    setPageSelections((prev) => ({
      ...prev,
      [selectedPage]: {
        ...(prev[selectedPage] ?? { pageType: pageType }),
        templateType: nextTemplateType,
      },
    }));
  };

  // 페이지 추가
  const handleAddPage = () => {
    const newPageId = Math.max(...pages.map(p => p.id), 0) + 1;
    const newPage = { id: newPageId, label: `Page ${newPageId}` };
    
    setPages((prev) => [...prev, newPage]);
    setPageSelections((prev) => ({
      ...prev,
      [newPageId]: getDefaultSelectionForPage(newPageId),
    }));
    // 배경색 설정 제거됨 (전역 배경색 사용)
    setDesignValues((prev) => ({
      ...prev,
      [newPageId]: templateDefaultValues['기타']?.['유형1'] ?? {},
    }));
    setSelectedPage(newPageId);
  };

  // 페이지 제거
  const handleRemovePage = (pageId: number) => {
    if (pages.length <= 1) {
      alert('최소 1개의 페이지는 필요합니다.');
      return;
    }

    setPages((prev) => prev.filter((p) => p.id !== pageId));
    
    // 제거된 페이지의 데이터 정리
    setPageSelections((prev) => {
      const updated = { ...prev };
      delete updated[pageId];
      return updated;
    });
    // 배경색 관리 제거됨 (전역 배경색 사용)
    setDesignValues((prev) => {
      const updated = { ...prev };
      delete updated[pageId];
      return updated;
    });

    // 현재 선택된 페이지가 제거되면 다른 페이지 선택
    if (selectedPage === pageId) {
      const remainingPages = pages.filter((p) => p.id !== pageId);
      if (remainingPages.length > 0) {
        setSelectedPage(remainingPages[0].id);
      }
    }
  };

  const renderDesignFields = () => {
    if (!isTemplateAvailable) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          선택한 템플릿의 디자인 편집 UI가 준비 중입니다.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {currentFields.map((field) => {
          const defaultValue = currentDefaultValues[field.id] ?? '';
          const value = currentDesignValues[field.id] ?? defaultValue;
          const colorFieldId = `${field.id}Color`;
          const visibilityFieldId = `${field.id}Visible`;
          const colorValue = currentDesignValues[colorFieldId] ?? field.defaultColor ?? '#FFFFFF';
          const isVisible = currentDesignValues[visibilityFieldId] !== 'false';
          const isDefaultValue = value === defaultValue && defaultValue !== '';
          const sharedProps = {
            id: field.id,
            value,
            placeholder: field.placeholder ?? '내용 입력',
            onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              handleDesignChange(field.id, event.target.value),
            onFocus: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              if (isDefaultValue) {
                handleDesignChange(field.id, '');
                event.target.value = '';
              }
            },
            className: `flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              isDefaultValue ? 'text-gray-400 opacity-50' : 'text-gray-900'
            }`,
          };

          // 이미지 필드 처리
          if (field.type === 'image') {
            return (
              <div key={field.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                {/* 상단: 라벨 + 업로드 버튼 + 토글 */}
                <div className="mb-4 flex items-center gap-3">
                  <label htmlFor={field.id} className="text-sm font-semibold text-gray-800">
                    {field.label}
                  </label>
                  <div className="flex flex-1 items-center gap-3">
                    <input
                      id={`${field.id}-file`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageSelect(field.id, file);
                        }
                      }}
                    />
                    <label
                      htmlFor={`${field.id}-file`}
                      className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      이미지 선택
                    </label>
                    {value && (
                      <span className="text-xs text-gray-500 truncate max-w-xs">
                        이미지 업로드됨
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVisibilityToggle(field.id, !isVisible)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isVisible ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={isVisible}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isVisible ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {/* 이미지 미리보기 */}
                {value && (
                  <div className="mt-3">
                    <img
                      src={value}
                      alt="미리보기"
                      className="max-h-48 w-full rounded-lg border border-gray-200 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={field.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              {/* 상단: 라벨 + 입력 필드 + 토글 */}
              <div className="mb-4 flex items-center gap-3">
                <label htmlFor={field.id} className="text-sm font-semibold text-gray-800">
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea {...sharedProps} rows={2} />
                ) : (
                  <input type="text" {...sharedProps} />
                )}
                <button
                  type="button"
                  onClick={() => handleVisibilityToggle(field.id, !isVisible)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isVisible ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={isVisible}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isVisible ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 하단: 색상 선택 (color input + 현재 색상 + 복사 버튼 + 팔레트) */}
              {field.hasColor && (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(event) => handleColorChange(field.id, event.target.value)}
                    className="h-8 w-12 cursor-pointer rounded-md border border-gray-200 bg-white p-1 shadow-sm"
                  />
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>현재 색상:</span>
                    <input
                      type="text"
                      value={colorValue.toUpperCase()}
                      onChange={(event) => {
                        // 입력 중에는 모든 값을 허용 (자유롭게 편집 가능)
                        const newValue = event.target.value;
                        handleColorChange(field.id, newValue);
                      }}
                      onBlur={(event) => {
                        // 포커스를 잃을 때 유효한 hex 색상으로 정규화
                        const value = event.target.value.trim();
                        const hexPattern = /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i;
                        
                        if (value === '' || value === '#') {
                          // 빈 값이면 기본값으로 복원
                          handleColorChange(field.id, colorValue);
                        } else if (hexPattern.test(value)) {
                          // 유효한 hex 색상이면 정규화 (# 추가)
                          const normalizedValue = value.startsWith('#') ? value : `#${value}`;
                          handleColorChange(field.id, normalizedValue);
                        } else {
                          // 유효하지 않은 값이면 원래 값으로 복원
                          handleColorChange(field.id, colorValue);
                        }
                      }}
                      placeholder="#000000"
                      className="w-20 rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(colorValue.toUpperCase());
                          alert('색상 코드가 클립보드에 복사되었습니다.');
                        } catch (error) {
                          alert('복사에 실패했습니다.');
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600"
                      title="색상 코드 복사"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {colorPalette.map((color) => {
                      const isSelected = colorValue.toLowerCase() === color.toLowerCase();
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorChange(field.id, color)}
                          className={`relative h-8 w-8 rounded border-2 transition-all ${
                            isSelected
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        >
                          {isSelected && (
                            <svg
                              className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          랜딩 페이지 디자인 (Page {selectedPage.toString().padStart(2, '0')})
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          템플릿 유형과 디자인을 선택하고, 배경 색상과 콘텐츠를 조정합니다.
        </p>
      </div>

      {/* 전역 배경색 선택 */}
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-5">
        <span className="text-xs font-semibold text-gray-700">랜딩 페이지 배경 색 (모든 페이지에 적용)</span>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={currentBackgroundColor}
            onChange={(event) => handleBackgroundColorChange(event.target.value)}
            className="h-10 w-20 cursor-pointer rounded-md border border-gray-200 bg-white p-1 shadow-sm"
          />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>현재 색상:</span>
            <span className="rounded-md border border-gray-200 bg-white px-2 py-1 font-medium text-gray-700">
              {currentBackgroundColor.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[500px_1fr]">
        {/* 좌측: 랜딩 페이지 미리보기 */}
        <div className="rounded-3xl border border-slate-200 bg-slate-100/80 p-6 shadow-inner">
          <div className="rounded-2xl border border-white/70 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm">
            랜딩 페이지 미리보기
          </div>

          <div className="mt-5 flex gap-5">
            {/* 썸네일 리스트 */}
            <div className="flex h-[460px] w-[200px] flex-col items-center rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-sm font-semibold text-blue-600">
                {selectedPage} / {pages.length}
              </span>
              <div className="mt-4 w-full flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3 pr-1">
                  {pages.map((page) => {
                    const isActive = page.id === selectedPage;
                    const pageSelection = pageSelections[page.id] || getDefaultSelectionForPage(page.id);
                    const PageTemplate = templateComponentMap[pageSelection.pageType]?.[pageSelection.templateType];
                    const pageDefaultValues = templateDefaultValues[pageSelection.pageType]?.[pageSelection.templateType] || {};
                    const pageDesignValues = designValues[page.id] || {};
                    const pageBgColor = globalBackgroundColor;
                    const pageData = { ...pageDefaultValues, ...pageDesignValues, backgroundColor: pageBgColor };
                    
                    return (
                      <div key={page.id} className="relative group">
                        <button
                          onClick={() => setSelectedPage(page.id)}
                          className={`group flex w-full flex-col items-center gap-2 rounded-2xl border-2 px-3 py-3 transition-all ${
                            isActive
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`relative h-24 w-16 overflow-hidden rounded-2xl border ${
                              isActive
                                ? 'border-blue-500 bg-white'
                                : 'border-slate-200 bg-slate-100'
                            }`}
                          >
                            {PageTemplate ? (
                              <div 
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                style={{ 
                                  transform: 'translate(-50%, -50%) scale(0.25)',
                                  width: '232px',
                                  height: '470px',
                                }}
                              >
                                <PageTemplate data={pageData} />
                              </div>
                            ) : (
                              <div 
                                className="flex h-full w-full items-center justify-center text-[8px] text-slate-400"
                                style={{ backgroundColor: pageBgColor }}
                              >
                                {pageSelection.pageType || '미리보기'}
                              </div>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                              isActive ? 'bg-blue-500 text-white' : 'text-slate-500'
                            }`}
                          >
                            {page.label}
                          </span>
                        </button>
                        {pages.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePage(page.id);
                            }}
                            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                            title="페이지 삭제"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={handleAddPage}
                className="mt-4 w-full rounded-xl bg-blue-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-600"
              >
                + 화면 추가하기
              </button>
            </div>

            <div className="hidden h-[460px] w-[2px] rounded-full bg-slate-400 lg:block" />

            {/* 메인 미리보기 */}
            <div className="flex flex-1 flex-col items-center gap-4">
              <div className="text-sm font-semibold text-slate-800">
                {selectedPageLabel} · Page {selectedPage.toString().padStart(2, '0')}
              </div>
              {isTemplateAvailable && SelectedTemplate ? (
                <SelectedTemplate data={{ ...currentDesignValues, backgroundColor: currentBackgroundColor }} />
              ) : (
                <PhoneFrame innerBackgroundColor={currentBackgroundColor}>
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                    결과 없음
                    <span className="text-xs font-normal text-slate-400">
                      선택한 조합의 미리보기가 준비 중입니다.
                    </span>
                  </div>
                </PhoneFrame>
              )}
            </div>
          </div>
        </div>

        {/* 우측: 디자인 편집 */}
    <div className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('type')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'type'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              1. 템플릿 유형
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'design'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              2. 템플릿 디자인
            </button>
          </div>

          {activeTab === 'type' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">페이지 유형 선택</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableTemplateCategories.map((item) => {
                    const isSelected = pageType === item;
                    return (
                      <button
                        key={item}
                        onClick={() => handlePageTypeChange(item)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'border border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800">템플릿 스타일</h4>
                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {availableTemplateVariants.length > 0 ? (
                    availableTemplateVariants.map((item) => {
                    const isSelected = templateType === item;
                    return (
                      <button
                        key={item}
                        onClick={() => handleTemplateTypeChange(item)}
                        className={`rounded-2xl border p-4 text-left transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <span
                            className={`h-3 w-3 rounded-full border ${
                              isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                            }`}
                          />
                          {item}
                        </div>
                        <div className="mt-3 h-36 rounded-xl border border-dashed border-gray-300 bg-gray-50"></div>
                      </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                      선택 가능한 템플릿 유형이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'design' && renderDesignFields()}
        </div>
      </div>
    </section>
  );
});

LandingPageSection.displayName = 'LandingPageSection';

export default LandingPageSection;

