import BlankTemplatePreview from '../templates/common/BlankTemplatePreview';
import CoverType01Preview from '../templates/cover/Type01Preview';
import CoverType02Preview from '../templates/cover/Type02Preview';

// 타입 정의
export type TemplateCategory = '표지' | '본문 1' | '본문 2' | '본문 3' | '갤러리' | '기타';
export type TemplateVariant = '유형1' | '유형2';

export interface TemplateField {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'image';
  hasColor?: boolean;
  defaultColor?: string;
}

export type TemplateComponent = (props: { data: Record<string, string> }) => JSX.Element;

// 템플릿 카테고리 및 변형 목록
export const templateCategories: TemplateCategory[] = ['표지', '본문 1', '본문 2', '본문 3', '갤러리', '기타'];
export const templateVariants: TemplateVariant[] = ['유형1', '유형2'];

// 템플릿 컴포넌트 맵
export const templateComponentMap: Record<TemplateCategory, Partial<Record<TemplateVariant, TemplateComponent>>> = {
  표지: {
    유형1: CoverType01Preview,
    유형2: CoverType02Preview,
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

// 색상 팔레트
export const colorPalette = [
  '#73769A',
  '#785B6F',
  '#748197',
  '#739C94',
  '#85976F',
  '#857361',
  '#9F7374',
];

// 템플릿 필드 설정
export const templateFieldConfigs: Record<TemplateCategory, Partial<Record<TemplateVariant, TemplateField[]>>> = {
  표지: {
    유형1: [
      { id: 'label', label: '라벨 영역', description: '상단 라벨 텍스트', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#FFFFFF' },
      { id: 'titlePrimary', label: '타이틀', description: '메인 타이틀', placeholder: '내용 입력', hasColor: true, defaultColor: '#FFFFFF' },
      { id: 'titleSecondary', label: '타이틀 (2)', description: '두 번째 타이틀 줄', placeholder: '내용 입력', hasColor: true, defaultColor: '#FFFFFF' },
      { id: 'subtitle', label: '서브타이틀', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#D1D5DB' },
      { id: 'body1', label: '본문 (1)', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#E5E7EB' },
      { id: 'body2', label: '본문 (2)', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#E5E7EB' },
      { id: 'body3', label: '본문 (3)', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#E5E7EB' },
      { id: 'imageUrl', label: '배경 이미지', description: '배경으로 사용될 이미지', placeholder: '이미지를 선택하세요', type: 'image' },
    ],
    유형2: [
      { id: 'label', label: '라벨 영역', description: '상단 라벨 텍스트', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#FFFFFF' },
      { id: 'titlePrimary', label: '타이틀', description: '메인 타이틀', placeholder: '내용 입력', hasColor: true, defaultColor: '#FFFFFF' },
      { id: 'titleSecondary', label: '타이틀 (2)', description: '두 번째 타이틀 줄', placeholder: '내용 입력', hasColor: true, defaultColor: '#FFFFFF' },
      { id: 'subtitle', label: '서브타이틀', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#D1D5DB' },
      { id: 'body1', label: '본문 (1)', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#E5E7EB' },
      { id: 'body2', label: '본문 (2)', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#E5E7EB' },
      { id: 'body3', label: '본문 (3)', placeholder: '내용 입력', type: 'text', hasColor: true, defaultColor: '#E5E7EB' },
      { id: 'imageUrl', label: '이미지', description: '하단에 표시될 이미지', placeholder: '이미지를 선택하세요', type: 'image' },
    ],
  },
  '본문 1': {},
  '본문 2': {},
  '본문 3': {},
  갤러리: {},
  기타: {},
};

// 템플릿 기본값
export const templateDefaultValues: Record<TemplateCategory, Partial<Record<TemplateVariant, Record<string, string>>>> = {
  표지: {
    유형1: {
      label: '라벨영역',
      titlePrimary: '타이틀영역',
      titleSecondary: '타이틀영역',
      subtitle: '서브타이틀영역',
      body1: '본문영역',
      body2: '본문영역',
      body3: '본문영역',
      imageUrl: '',
    },
    유형2: {
      label: '라벨영역',
      titlePrimary: '타이틀영역',
      titleSecondary: '타이틀영역',
      subtitle: '서브타이틀영역',
      body1: '본문영역',
      body2: '본문영역',
      body3: '본문영역',
      imageUrl: '',
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

// 페이지별 기본 선택 반환 함수
export const getDefaultSelectionForPage = (
  pageId: number
): { pageType: TemplateCategory; templateType: TemplateVariant } => {
  if (pageId === 1) {
    return { pageType: '표지', templateType: '유형1' };
  }
  return { pageType: '기타', templateType: '유형1' };
};

