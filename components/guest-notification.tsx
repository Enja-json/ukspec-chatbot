'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Session } from 'next-auth';

interface GuestNotificationProps {
  session: Session;
}

export function GuestNotification({ session }: GuestNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const isGuestUser = session?.user?.type === 'guest';

  useEffect(() => {
    // Only show for guest users and if not previously dismissed
    if (isGuestUser && !isDismissed) {
      // Show notification after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isGuestUser, isDismissed]);

  // Don't render anything if not a guest user or if dismissed
  if (!isGuestUser || isDismissed) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Upgrade your account
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Signed up users gain access to 10x more messages per day
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-muted"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 