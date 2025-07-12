'use client';

import { ArrowUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePaywall } from '@/components/paywall-provider';
import { useSubscription } from '@/hooks/use-subscription';

interface UpgradeButtonProps {
  className?: string;
}

export function UpgradeButton({ className }: UpgradeButtonProps) {
  const { showPaywall, isLoading } = usePaywall();
  const { isProfessional, needsUpgrade, isLoading: isSubscriptionLoading } = useSubscription();

  const handleUpgrade = () => {
    showPaywall('signup');
  };

  // Don't show button if subscription is loading, user is already professional, or doesn't need upgrade
  if (isSubscriptionLoading || isProfessional || !needsUpgrade) {
    return null;
  }

  return (
    <Button
      onClick={handleUpgrade}
      variant="default"
      className={`bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2 transition-all ${className}`}
      disabled={isLoading}
    >
      <ArrowUpIcon size={16} />
      <span className="hidden sm:inline">Upgrade to Professional</span>
      <span className="sm:hidden">Upgrade</span>
    </Button>
  );
} 