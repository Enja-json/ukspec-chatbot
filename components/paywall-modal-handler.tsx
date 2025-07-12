'use client';

import { PaywallModal } from '@/components/paywall-modal';
import { usePaywall } from '@/components/paywall-provider';

export function PaywallModalHandler() {
  const { isPaywallOpen, hidePaywall, paywallTrigger, startTrial, isLoading } = usePaywall();
  
  return (
    <PaywallModal
      isOpen={isPaywallOpen}
      onClose={hidePaywall}
      trigger={paywallTrigger || 'signup'}
      onStartTrial={startTrial}
      isLoading={isLoading}
    />
  );
} 