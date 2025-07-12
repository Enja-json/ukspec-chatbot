'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePaywall } from '@/components/paywall-provider';

function SignupPaywallContent() {
  const searchParams = useSearchParams();
  const signup = searchParams.get('signup');
  const { showPaywall } = usePaywall();

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

  return null; // No need to render anything as the PaywallModal is handled globally
}

export function SignupPaywallHandler() {
  return (
    <Suspense>
      <SignupPaywallContent />
    </Suspense>
  );
} 