'use client';

interface EventCategoryItemProps {
  label: string;
  count: number;
  isLast?: boolean;
}

function EventCategoryItem({ label, count, isLast = false }: EventCategoryItemProps) {
  return (
    <div className={`flex items-center justify-between cursor-pointer hover:bg-gray-50 p-4 ${isLast ? '' : 'relative'}`}>
      <span className="text-sm text-gray-900">{label}</span>
      <div className="flex items-center gap-2">
        <span className="px-3 py-0.5 bg-[#6C7885] text-white text-sm font-semibold rounded-full">{count}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      {!isLast && <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-200"></div>}
    </div>
  );
}

interface EventCategorySectionProps {
  displayName: string;
  totalEvents: number;
  ongoingEvents: number;
  savedEvents: number;
  endedEvents: number;
}

export default function EventCategorySection({
  displayName,
  totalEvents,
  ongoingEvents,
  savedEvents,
  endedEvents,
}: EventCategorySectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        {displayName}님의 이벤트
      </h3>
      <div className="bg-white rounded shadow-sm border border-gray-200">
        <EventCategoryItem label="총 제작된 이벤트" count={totalEvents} />
        <EventCategoryItem label="진행중 이벤트" count={ongoingEvents} />
        <EventCategoryItem label="임시저장 이벤트" count={savedEvents} />
        <EventCategoryItem label="종료된 이벤트" count={endedEvents} isLast />
      </div>
    </div>
  );
}

