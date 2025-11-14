/**
 * 페이지 빌더 데이터를 DB 구조로 변환하는 유틸리티
 */

// LandingPageSection의 state 타입
export interface PageBuilderData {
  pageSelections: Record<number, { pageType: string; templateType: string }>;
  pageBackgroundColors: Record<number, string>;
  designValues: Record<number, Record<string, string>>;
}

// DB 저장용 타입
export interface LandingPageData {
  page_number: number;
  page_type: string;
  template_type: string;
  background_color: string;
  contents: Array<{
    field_id: string;
    field_value: string | null;
    field_color: string | null;
    is_visible: boolean;
  }>;
}

/**
 * LandingPageSection의 데이터를 DB 구조로 변환
 */
export function convertPageBuilderToDB(
  pageBuilderData: PageBuilderData
): LandingPageData[] {
  const result: LandingPageData[] = [];
  const pageNumbers = [1, 2, 3, 4, 5]; // 고정된 5개 페이지

  for (const pageNumber of pageNumbers) {
    const selection = pageBuilderData.pageSelections[pageNumber];
    const backgroundColor = pageBuilderData.pageBackgroundColors[pageNumber] || '#000000';
    const designValues = pageBuilderData.designValues[pageNumber] || {};

    if (!selection) {
      // 기본값 사용
      const defaultSelection = pageNumber === 1 
        ? { pageType: '표지', templateType: '유형1' }
        : { pageType: '기타', templateType: '유형1' };
      
      result.push({
        page_number: pageNumber,
        page_type: defaultSelection.pageType,
        template_type: defaultSelection.templateType,
        background_color: backgroundColor,
        contents: [],
      });
      continue;
    }

    // 콘텐츠 추출
    const contents: LandingPageData['contents'] = [];
    
    // designValues에서 필드별로 추출
    // field_id와 field_value, field_color, is_visible을 추출
    const fieldIds = new Set<string>();
    
    // 모든 키를 순회하면서 필드 ID 추출
    Object.keys(designValues).forEach((key) => {
      // Color나 Visible 접미사 제거
      const baseFieldId = key.replace(/Color$/, '').replace(/Visible$/, '');
      if (!baseFieldId.includes('Color') && !baseFieldId.includes('Visible')) {
        fieldIds.add(baseFieldId);
      }
    });

    // 각 필드에 대해 콘텐츠 생성
    fieldIds.forEach((fieldId) => {
      const value = designValues[fieldId] || null;
      const color = designValues[`${fieldId}Color`] || null;
      const visible = designValues[`${fieldId}Visible`] !== 'false';

      // 빈 값이 아닌 경우만 추가
      if (value !== null && value !== undefined && value !== '') {
        contents.push({
          field_id: fieldId,
          field_value: value,
          field_color: color,
          is_visible: visible,
        });
      }
    });

    result.push({
      page_number: pageNumber,
      page_type: selection.pageType,
      template_type: selection.templateType,
      background_color: backgroundColor,
      contents,
    });
  }

  return result;
}

/**
 * DB 데이터를 페이지 빌더 구조로 변환
 */
export function convertDBToPageBuilder(
  landingPages: Array<{
    page_number: number;
    page_type: string;
    template_type: string;
    background_color: string;
    contents?: Array<{
      field_id: string;
      field_value: string | null;
      field_color: string | null;
      is_visible: boolean;
    }>;
  }>
): PageBuilderData {
  const pageSelections: Record<number, { pageType: string; templateType: string }> = {};
  const pageBackgroundColors: Record<number, string> = {};
  const designValues: Record<number, Record<string, string>> = {};

  landingPages.forEach((page) => {
    const pageNumber = page.page_number;
    
    pageSelections[pageNumber] = {
      pageType: page.page_type,
      templateType: page.template_type,
    };
    
    pageBackgroundColors[pageNumber] = page.background_color || '#000000';
    
    // 콘텐츠를 designValues로 변환
    const pageDesignValues: Record<string, string> = {};
    
    if (page.contents && Array.isArray(page.contents)) {
      page.contents.forEach((content) => {
        if (content.field_value !== null) {
          pageDesignValues[content.field_id] = content.field_value;
        }
        if (content.field_color !== null) {
          pageDesignValues[`${content.field_id}Color`] = content.field_color;
        }
        pageDesignValues[`${content.field_id}Visible`] = content.is_visible ? 'true' : 'false';
      });
    }
    
    designValues[pageNumber] = pageDesignValues;
  });

  return {
    pageSelections,
    pageBackgroundColors,
    designValues,
  };
}

