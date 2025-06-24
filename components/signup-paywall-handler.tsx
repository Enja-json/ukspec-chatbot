'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PaywallModal } from './paywall-modal';
import { usePaywall } from '@/hooks/use-paywall';

function SignupPaywallContent() {
  const searchParams = useSearchParams();
  const signup = searchParams.get('signup');
  const { isPaywallOpen, showPaywall, hidePaywall, paywallTrigger, startTrial, isLoading } = usePaywall();

  useEffect(() => {
    if (signup === 'true') {
      // Show paywall modal after a brief delay to ensure the page has loaded
      setTimeout(() => {
        showPaywall('signup');
      }, 1000);
      
      // Clean up the URL after showing the modal
      if (window.history.replaceState) {
        window.history.replaceState({}, '', '/');
      }
    }
  }, [signup, showPaywall]);

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

export function SignupPaywallHandler() {
  return (
    <Suspense fallback={null}>
      <SignupPaywallContent />
    </Suspense>
  );
} 