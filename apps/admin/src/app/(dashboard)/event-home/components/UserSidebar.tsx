'use client';

import UserProfile from './UserProfile';
import EventCategorySection from './EventCategorySection';

interface UserSidebarProps {
  displayName: string;
  totalEvents: number;
  ongoingEvents: number;
  savedEvents: number;
  endedEvents: number;
}

export default function UserSidebar({
  displayName,
  totalEvents,
  ongoingEvents,
  savedEvents,
  endedEvents,
}: UserSidebarProps) {
  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
      <div className="p-6">
        <UserProfile displayName={displayName} />
        <EventCategorySection
          displayName={displayName}
          totalEvents={totalEvents}
          ongoingEvents={ongoingEvents}
          savedEvents={savedEvents}
          endedEvents={endedEvents}
        />
      </div>
    </aside>
  );
}

