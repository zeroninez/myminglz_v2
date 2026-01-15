'use client';

import { EventsProvider } from '@/contexts/EventsContext';

export default function EventsProviderWrapper({ children }: { children: React.ReactNode }) {
  return <EventsProvider>{children}</EventsProvider>;
}

