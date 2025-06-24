'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/components/toast';

interface UsePaywallReturn {
  isPaywallOpen: boolean;
  showPaywall: (trigger: 'signup' | 'rate-limit') => void;
  hidePaywall: () => void;
  paywallTrigger: 'signup' | 'rate-limit' | null;
  startTrial: (priceId: string) => Promise<void>;
  isLoading: boolean;
}

export function usePaywall(): UsePaywallReturn {
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<'signup' | 'rate-limit' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showPaywall = useCallback((trigger: 'signup' | 'rate-limit') => {
    setPaywallTrigger(trigger);
    setIsPaywallOpen(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    setPaywallTrigger(null);
  }, []);

  const startTrial = useCallback(async (priceId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout');
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Failed to start trial:', error);
      toast({
        type: 'error',
        description: error.message || 'Failed to start checkout. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isPaywallOpen,
    showPaywall,
    hidePaywall,
    paywallTrigger,
    startTrial,
    isLoading,
  };
} 