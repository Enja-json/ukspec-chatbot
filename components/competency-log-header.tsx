'use client';

import { SidebarToggle } from '@/components/sidebar-toggle';

export function CompetencyLogHeader() {
  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2">
      <SidebarToggle />
    </header>
  );
} 