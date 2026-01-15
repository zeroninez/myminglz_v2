'use client';

interface EventFilterProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  eventNames: string[];
  ongoingEvents: number;
}

export default function EventFilter({
  selectedFilter,
  onFilterChange,
  eventNames,
  ongoingEvents,
}: EventFilterProps) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onFilterChange('전체')}
        className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
          selectedFilter === '전체'
            ? 'bg-[#414B55] text-white border-[#414B55]'
            : 'bg-[#F3F4F6] text-[#8E8E8E] border-[#F3F4F6] hover:bg-[#E5E7EB]'
        }`}
      >
        전체({ongoingEvents})
      </button>
      {eventNames.map((name) => (
        <button
          key={name}
          onClick={() => onFilterChange(name)}
          className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
            selectedFilter === name
              ? 'bg-[#414B55] text-white border-[#414B55]'
              : 'bg-[#F3F4F6] text-[#8E8E8E] border-[#F3F4F6] hover:bg-[#E5E7EB]'
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

