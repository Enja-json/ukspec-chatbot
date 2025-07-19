'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { ClipboardList, TrendingUp } from 'lucide-react';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { UpgradeButton } from './upgrade-button';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <img 
                src="/images/logoweb.png" 
                alt="Mini Mentor Logo" 
                className="w-6 h-6 object-contain"
              />
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                Mini Mentor
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
            Tools
          </div>
          <div className="px-2 space-y-1">
            <Link
              href="/competency-log"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex items-center gap-3 px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Competency Log
            </Link>
            <Link
              href="/competency-analytics"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex items-center gap-3 px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Your Progress
            </Link>
            
            {/* Upgrade Button */}
            <div className="px-2 py-2">
              <UpgradeButton className="w-full" />
            </div>
          </div>
        </SidebarMenu>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
};
