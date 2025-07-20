'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from '@/components/toast';

interface PaywallContextType {
  isPaywallOpen: boolean;
  showPaywall: (trigger: 'signup' | 'rate-limit' | 'competency-limit') => void;
  hidePaywall: () => void;
  paywallTrigger: 'signup' | 'rate-limit' | 'competency-limit' | null;
  startTrial: (priceId: string) => Promise<void>;
  isLoading: boolean;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export function PaywallProvider({ children }: { children: ReactNode }) {
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<'signup' | 'rate-limit' | 'competency-limit' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showPaywall = useCallback((trigger: 'signup' | 'rate-limit' | 'competency-limit') => {
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

  const value = {
    isPaywallOpen,
    showPaywall,
    hidePaywall,
    paywallTrigger,
    startTrial,
    isLoading,
  };

  return (
    <PaywallContext.Provider value={value}>
      {children}
    </PaywallContext.Provider>
  );
}

export function usePaywall() {
  const context = useContext(PaywallContext);
  if (context === undefined) {
    throw new Error('usePaywall must be used within a PaywallProvider');
  }
  return context;
} 