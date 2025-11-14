import PhoneFrame from '../components/PhoneFrame';

interface BlankTemplatePreviewProps {
  data: Record<string, string>;
}

export default function BlankTemplatePreview({ data }: BlankTemplatePreviewProps) {
  const message = data.message ?? '빈 화면입니다.';
  const backgroundColor = data.backgroundColor ?? '#000000';
  return (
    <PhoneFrame innerBackgroundColor={backgroundColor}>
      <div className="mt-auto mb-12 flex flex-col items-center justify-center gap-3 text-center text-sm text-gray-200">
        <span>{message}</span>
        <span className="text-xs text-gray-400">템플릿을 추가하면 이 영역에 표시됩니다.</span>
      </div>
    </PhoneFrame>
  );
}

