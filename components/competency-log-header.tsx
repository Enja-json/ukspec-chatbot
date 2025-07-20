'use client';

import { useEffect, useState } from 'react';
import type { Session } from 'next-auth';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { getUserEntitlements } from '@/lib/ai/entitlements';
import { usePaywall } from '@/components/paywall-provider';

interface CompetencyLogHeaderProps {
  session: Session;
}

export function CompetencyLogHeader({ session }: CompetencyLogHeaderProps) {
  const [userSubscriptionStatus, setUserSubscriptionStatus] = useState<string>('none');
  const { showPaywall } = usePaywall();

  // Get user entitlements
  const userType = session.user?.type || 'regular';
  const userEntitlements = getUserEntitlements(userType, userSubscriptionStatus as any);
  const canExport = userEntitlements.canExportCompetencyLog;

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        const response = await fetch('/api/user/details');
        if (response.ok) {
          const userData = await response.json();
          setUserSubscriptionStatus(userData.subscriptionStatus || 'none');
        }
      } catch (err) {
        console.error('Failed to fetch user details:', err);
      }
    }

    fetchUserDetails();
  }, []);

  const handleExport = async () => {
    if (!canExport) {
      // Show paywall modal for non-professional users
      showPaywall('signup');
      return;
    }

    try {
      const response = await fetch('/api/competency/export');
      if (!response.ok) throw new Error('Export failed');
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Format current date for filename
      const today = new Date();
      const dateString = today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `competency-log-${dateString}.xlsx`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting competency log:', error);
    }
  };

  return (
    <header className="flex items-center justify-between gap-3 p-4 border-b">
      <div className="flex items-center gap-3">
        <SidebarToggle />
        <div>
          <h1 className="text-xl font-semibold">Competency Log</h1>
          <p className="text-sm text-muted-foreground">
            Track your engineering tasks and map them to UK-SPEC competencies
          </p>
        </div>
      </div>
      
      <Button
        onClick={handleExport}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export to Excel
      </Button>
    </header>
  );
} 