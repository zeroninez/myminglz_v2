'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import PhoneFrame from '../templates/components/PhoneFrame';
import BlankTemplatePreview from '../templates/common/BlankTemplatePreview';
import CoverType01Preview from '../templates/cover/Type01Preview';

const backgroundColors = ['#0F172A', '#111827', '#1E293B', '#F8FAFC'];

type TemplateCategory = '표지' | '본문 1' | '본문 2' | '본문 3' | '갤러리' | '기타';
type TemplateVariant = '유형1' | '유형2';

const templateCategories: TemplateCategory[] = ['표지', '본문 1', '본문 2', '본문 3', '갤러리', '기타'];
const templateVariants: TemplateVariant[] = ['유형1', '유형2'];

interface TemplateField {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  type?: 'text' | 'textarea';
  hasColor?: boolean;
  defaultColor?: string;
}

type TemplateComponent = (props: { data: Record<string, string> }) => JSX.Element;

const templateComponentMap: Record<TemplateCategory, Partial<Record<TemplateVariant, TemplateComponent>>> = {
  표지: {
    유형1: CoverType01Preview,
  },
  '본문 1': {
    유형1: BlankTemplatePreview,
  },
  '본문 2': {
    유형1: BlankTemplatePreview,
  },
  '본문 3': {
    유형1: BlankTemplatePreview,
  },
  갤러리: {
    유형1: BlankTemplatePreview,
  },
  기타: {
    유형1: BlankTemplatePreview,
  },
};

const colorPalette = [
  '#73769A',
  '#785B6F',
  '#748197',
  '#739C94',
  '#85976F',
  '#857361',
  '#9F7374',
];

const templateFieldConfigs: Record<TemplateCategory, Partial<Record<TemplateVariant, TemplateField[]>>> = {
  표지: {
    유형1: [
      { id: 'label', label: '라벨 영역', description: '상단 라벨 텍스트', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#FFFFFF' },
      { id: 'titlePrimary', label: '타이틀', description: '메인 타이틀', placeholder: '내용 입력', hasColor: true, defaultColor: '#FFFFFF' },
      { id: 'titleSecondary', label: '타이틀 (2)', description: '두 번째 타이틀 줄', placeholder: '내용 입력', hasColor: true, defaultColor: '#FFFFFF' },
      { id: 'subtitle', label: '서브타이틀', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#D1D5DB' },
      { id: 'body1', label: '본문 (1)', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#E5E7EB' },
      { id: 'body2', label: '본문 (2)', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#E5E7EB' },
      { id: 'body3', label: '본문 (3)', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#E5E7EB' },
    ],
  },
  '본문 1': {},
  '본문 2': {},
  '본문 3': {},
  갤러리: {},
  기타: {},
};

const templateDefaultValues: Record<TemplateCategory, Partial<Record<TemplateVariant, Record<string, string>>>> = {
  표지: {
    유형1: {
      label: '라벨영역',
      titlePrimary: '타이틀영역',
      titleSecondary: '타이틀영역',
      subtitle: '서브타이틀영역',
      body1: '본문영역',
      body2: '본문영역',
      body3: '본문영역',
    },
  },
  '본문 1': {
    유형1: {
      message: '본문 1 페이지가 준비 중입니다.',
    },
  },
  '본문 2': {
    유형1: {
      message: '본문 2 페이지가 준비 중입니다.',
    },
  },
  '본문 3': {
    유형1: {
      message: '본문 3 페이지가 준비 중입니다.',
    },
  },
  갤러리: {
    유형1: {
      message: '갤러리 페이지가 준비 중입니다.',
    },
  },
  기타: {
    유형1: {
      message: '콘텐츠가 곧 추가될 예정입니다.',
    },
  },
};

const getDefaultSelectionForPage = (
  pageId: number
): { pageType: TemplateCategory; templateType: TemplateVariant } => {
  if (pageId === 1) {
    return { pageType: '표지', templateType: '유형1' };
  }
  return { pageType: '기타', templateType: '유형1' };
};

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

export default function LandingPageSection({ initialData, onDataChange }: LandingPageSectionProps) {
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
  const [pageBackgroundColors, setPageBackgroundColors] = useState<Record<number, string>>(() => {
    if (initialData?.pageBackgroundColors) {
      return initialData.pageBackgroundColors;
    }
    return { 1: backgroundColors[0] };
  });
  const [designValues, setDesignValues] = useState<Record<number, Record<string, string>>>(() => {
    if (initialData?.designValues) {
      return initialData.designValues;
    }
    return { 1: templateDefaultValues['표지']?.['유형1'] ?? {} };
  });

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
      
      if (initialData.pageBackgroundColors) {
        setPageBackgroundColors(initialData.pageBackgroundColors);
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
      onDataChange({
        pageSelections: pageSelections as Record<number, { pageType: string; templateType: string }>,
        pageBackgroundColors,
        designValues,
      });
    }
  }, [pageSelections, pageBackgroundColors, designValues, onDataChange]);

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

  const currentBackgroundColor = pageBackgroundColors[selectedPage] ?? backgroundColors[0];

  const savedBackgroundColors = useMemo(() => {
    const colorMap = new Map<string, number[]>();
    Object.entries(pageBackgroundColors).forEach(([pageId, color]) => {
      const numericPageId = Number(pageId);
      if (!colorMap.has(color)) {
        colorMap.set(color, []);
      }
      colorMap.get(color)!.push(numericPageId);
    });
    return Array.from(colorMap.entries()).map(([color, pages]) => ({
      color,
      pages: pages.sort((a, b) => a - b),
    }));
  }, [pageBackgroundColors]);

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

  const handleBackgroundColorChange = (color: string) => {
    setPageBackgroundColors((prev) => ({
      ...prev,
      [selectedPage]: color,
    }));
  };

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

  useEffect(() => {
    setPageBackgroundColors((prev) => {
      if (prev[selectedPage]) {
        return prev;
      }
      return {
        ...prev,
        [selectedPage]: backgroundColors[0],
      };
    });
  }, [selectedPage]);

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
    setPageBackgroundColors((prev) => ({
      ...prev,
      [newPageId]: backgroundColors[0],
    }));
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
    setPageBackgroundColors((prev) => {
      const updated = { ...prev };
      delete updated[pageId];
      return updated;
    });
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

              {/* 하단: 선택됨 박스 + 색상 팔레트 */}
              {field.hasColor && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <span className="text-sm text-gray-700">선택됨</span>
                    <div
                      className="h-6 w-6 rounded border border-gray-300"
                      style={{ backgroundColor: colorValue }}
                    />
                  </div>
                  <div className="flex gap-2">
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
          템플릿 유형과 디자인을 선택하고, 배경 컬러와 콘텐츠를 조정합니다.
        </p>
      </div>

      <div className="rounded-lg border border-gray-100 bg-gray-50 p-5">
        <span className="text-xs font-semibold text-gray-700">랜딩 페이지 배경 색</span>
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
        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-white/60 p-3">
          <span className="text-xs font-semibold text-gray-600">사용 중인 배경색 빠르게 적용</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {savedBackgroundColors.map(({ color, pages: pageIds }) => {
              const isSelected = currentBackgroundColor.toLowerCase() === color.toLowerCase();
              const pageLabels = pageIds
                .map((pageId) => pages.find((page) => page.id === pageId)?.label ?? `Page ${pageId}`)
                .join(', ');
              return (
                <button
                  key={color}
                  onClick={() => handleBackgroundColorChange(color)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{color.toUpperCase()}</span>
                    <span className="text-[10px] text-gray-500">
                      사용 페이지: {pageLabels || '없음'}
                    </span>
                  </div>
                </button>
              );
            })}
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
                            className={`h-24 w-16 rounded-2xl border ${
                              isActive
                                ? 'border-blue-500 bg-white'
                                : 'border-slate-200 bg-slate-100'
                            }`}
                          />
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
}

