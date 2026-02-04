'use client';

import { ChangeEvent, useEffect, useMemo, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import PhoneFrame from '../templates/components/PhoneFrame';
import SplitFormLayout from './SplitFormLayout';
import Toggle from './Toggle';
import ColorPicker from './ColorPicker';
import AddLandingPageModal from './AddLandingPageModal';
import {
  type TemplateCategory,
  type TemplateVariant,
  type TemplateField,
  templateCategories,
  templateVariants,
  templateComponentMap,
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
  const [showAddPageModal, setShowAddPageModal] = useState(false);
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
    // Page 1은 항상 "표지"로 고정
    if (selectedPage === 1) {
      return {
        pageType: '표지' as TemplateCategory,
        templateType: (pageSelections[1]?.templateType ?? getDefaultSelectionForPage(1).templateType) as TemplateVariant,
      };
    }
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
      // Page 1은 항상 "표지"로 고정
      if (selectedPage === 1) {
        return {
          ...prev,
          1: {
            pageType: '표지' as TemplateCategory,
            templateType: prev[1]?.templateType ?? getDefaultSelectionForPage(1).templateType,
          },
        };
      }
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
    // 처음 추가하는 경우 (페이지가 1개일 때) 모달 표시
    if (pages.length === 1) {
      setShowAddPageModal(true);
      return;
    }
    
    // 두 번째 이후 추가는 바로 추가
    addPageDirectly();
  };

  // 페이지 직접 추가
  const addPageDirectly = () => {
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
    // 페이지 1은 삭제 불가
    if (pageId === 1) {
      return;
    }
    
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
                  <Toggle
                    checked={isVisible}
                    onChange={(checked: boolean) => handleVisibilityToggle(field.id, checked)}
                    variant="dark"
                  />
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
              <div className="mb-4 flex items-start gap-3">
                <label htmlFor={field.id} className="text-sm font-semibold text-gray-800 pt-2">
                  {field.label}
                </label>
                <textarea 
                  {...sharedProps} 
                  rows={3}
                  className={`${sharedProps.className} resize-y min-h-[80px]`}
                />
                <Toggle
                  checked={isVisible}
                  onChange={(checked: boolean) => handleVisibilityToggle(field.id, checked)}
                  variant="dark"
                  className="mt-2"
                />
              </div>

              {/* 하단: 색상 선택 */}
              {field.hasColor && (
                <ColorPicker
                  value={colorValue}
                  onChange={(color) => handleColorChange(field.id, color)}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="h-full flex flex-col">
      <div className="border border-gray-200 bg-white p-6 shadow-sm flex-1 flex flex-col min-h-0">
        <SplitFormLayout
        infoBox={{
          stepNumber: 4,
          title: (
            <>
              이벤트 랜딩페이지 정보 작성 단계입니다. <span className="text-[#32373D] font-normal"><span className="text-[#4D82F3] font-bold">*표시</span>는 필수로 작성해야할 정보입니다.</span>
            </>
          ),
          description: [
            '랜딩페이지 제작 단계는 이벤트 참여자가 QR을 스캔했을 때 가장 먼저 보게 되는 안내 페이지를 구성하는 단계입니다.',
            '이 단계에서는 이벤트에 대한 핵심 정보뿐 아니라, 브랜드의 이미지와 메시지가 자연스럽게 노출되도록 구성합니다.',
          ],
        }}
        scrollHeight="calc(100vh-280px)"
        rightContentPadding={false}
        leftContent={
          <div className="space-y-5">
            {/* 기본/추가 랜딩페이지 안내 */}
            <div className="space-y-2">
              <div className="rounded bg-[#e8f0fe] px-3 py-2">
                <span className="text-sm font-semibold text-[#4D82F3]">
                  {selectedPage === 1 
                    ? '*기본 랜딩페이지 Page 1.' 
                    : `*추가 랜딩페이지 Page ${pages.findIndex(p => p.id === selectedPage) + 1}.`}
                </span>
              </div>
              {selectedPage === 1 ? (
                <p className="text-sm text-[#4D82F3]">
                  기본 랜딩페이지 1개는 필수이며, 추가 페이지는 유형·레이아웃 선택을 통해 자유롭게 구성하고 연결할 수 있습니다.
                </p>
              ) : null}
            </div>

            <div className="space-y-5">
              {/* 템플릿 유형 선택 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">1. 템플릿 유형</h4>
                <div className="space-y-5">
                  {/* 페이지 유형 선택 - Page 1에서는 숨김 */}
                  {selectedPage !== 1 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">페이지 유형 선택</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        {availableTemplateCategories.map((item) => {
                          const isSelected = pageType === item;
                          return (
                            <button
                              key={item}
                              onClick={() => handlePageTypeChange(item)}
                              className={`rounded border px-4 py-2 text-left transition-colors ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                {isSelected ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 17C13.3833 17 14.5625 16.5125 15.5375 15.5375C16.5125 14.5625 17 13.3833 17 12C17 10.6167 16.5125 9.4375 15.5375 8.4625C14.5625 7.4875 13.3833 7 12 7C10.6167 7 9.4375 7.4875 8.4625 8.4625C7.4875 9.4375 7 10.6167 7 12C7 13.3833 7.4875 14.5625 8.4625 15.5375C9.4375 16.5125 10.6167 17 12 17ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z" fill="#32373D"/>
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z" fill="#32373D"/>
                                  </svg>
                                )}
                                {item}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 템플릿 스타일 - 모든 페이지에서 표시 */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">{pageType} 스타일</h5>
                    <div className="grid gap-4 md:grid-cols-2">
                      {availableTemplateVariants.length > 0 ? (
                        availableTemplateVariants.map((item, index) => {
                          const isSelected = templateType === item;
                          const displayLabel = `레이아웃 ${index + 1}`;
                          return (
                            <button
                              key={item}
                              onClick={() => handleTemplateTypeChange(item)}
                              className={`rounded border p-4 text-left transition-colors ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                                {isSelected ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 17C13.3833 17 14.5625 16.5125 15.5375 15.5375C16.5125 14.5625 17 13.3833 17 12C17 10.6167 16.5125 9.4375 15.5375 8.4625C14.5625 7.4875 13.3833 7 12 7C10.6167 7 9.4375 7.4875 8.4625 8.4625C7.4875 9.4375 7 10.6167 7 12C7 13.3833 7.4875 14.5625 8.4625 15.5375C9.4375 16.5125 10.6167 17 12 17ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z" fill="#32373D"/>
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z" fill="#32373D"/>
                                  </svg>
                                )}
                                {displayLabel}
                              </div>
                              <div className="relative w-full overflow-hidden rounded-xl">
                                <img
                                  src={item === '유형1' ? '/images/templates/type01-preview.png' : '/images/templates/type02-preview.png'}
                                  alt={`${displayLabel} 미리보기`}
                                  className="w-full h-auto object-contain max-h-32"
                                />
                              </div>
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
              </div>

              {/* 템플릿 디자인 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">2. 템플릿 디자인</h4>
                {renderDesignFields()}
              </div>
            </div>
          </div>
        }
        rightContent={
          <div className="h-full w-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
            <div className="flex gap-5 h-full pl-6 pt-12 pr-12 pb-20">
              {/* 썸네일 리스트 */}
              <div className="flex flex-[0_0_24%] flex-col items-start h-full">
                <div className="w-full flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3">
                  <div className="flex flex-col items-start gap-3">
                    {pages.map((page, index) => {
                      const isActive = page.id === selectedPage;
                      const pageNumber = index + 1; // 인덱스 기반 페이지 번호 (1부터 시작)
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
                            className="group flex w-full flex-col items-center gap-2 rounded-2xl px-3 py-3 transition-all"
                          >
                            {isActive && (
                              <div className="text-[10px] font-semibold mb-1" style={{ color: '#4D82F3' }}>
                                편집중
                              </div>
                            )}
                            <div
                              className={`relative w-16 overflow-hidden rounded-xl flex items-center justify-center ${
                                isActive
                                  ? 'border-4'
                                  : ''
                              }`}
                              style={{ 
                                aspectRatio: '232/470',
                                height: 'auto',
                                ...(isActive ? { borderColor: '#4D82F3' } : {})
                              }}
                            >
                              {PageTemplate ? (
                                <div 
                                  className="w-full h-full"
                                  style={{ 
                                    transform: 'scale(0.276)',
                                    transformOrigin: 'center center',
                                    width: '232px',
                                    height: '470px',
                                  }}
                                >
                                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <PageTemplate data={pageData} />
                                  </div>
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
                              className="rounded-md px-2 py-0.5 text-[10px] font-normal text-white whitespace-nowrap"
                              style={{ backgroundColor: isActive ? '#4D82F3' : '#888888' }}
                            >
                              Page {pageNumber}/{pages.length}
                            </span>
                          </button>
                          {pages.length > 1 && page.id !== 1 && (
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
                    <button
                      onClick={handleAddPage}
                      className="w-16 ml-2.5 rounded-xl border-2 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-3"
                      style={{ aspectRatio: '232/470', height: 'auto' }}
                    >
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs font-medium text-slate-500">추가</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 메인 미리보기 */}
              <div className="flex flex-[0_0_76%] flex-col items-center gap-4 w-full overflow-hidden">
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
        }
      />
      </div>
      
      {/* 추가 랜딩페이지 모달 */}
      <AddLandingPageModal
        isOpen={showAddPageModal}
        onClose={() => setShowAddPageModal(false)}
        onConfirm={() => {
          addPageDirectly();
          setShowAddPageModal(false);
        }}
      />
    </section>
  );
});

LandingPageSection.displayName = 'LandingPageSection';

export default LandingPageSection;

