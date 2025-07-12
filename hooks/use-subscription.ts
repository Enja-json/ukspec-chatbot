import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import type { SubscriptionStatus } from '@/lib/stripe/config';

interface SubscriptionData {
  subscriptionStatus: SubscriptionStatus;
  subscriptionId: string | null;
  trialEndsAt: string | null;
}

export function useSubscription() {
  const { data, error, isLoading, mutate } = useSWR<SubscriptionData>(
    '/api/user/subscription',
    fetcher
  );

  const isProfessional = data?.subscriptionStatus === 'trial' || data?.subscriptionStatus === 'active';
  const isTrialActive = data?.subscriptionStatus === 'trial';
  const isSubscriptionActive = data?.subscriptionStatus === 'active';
  const needsUpgrade = data?.subscriptionStatus === 'none' || data?.subscriptionStatus === 'cancelled';

  return {
    subscription: data,
    isProfessional,
    isTrialActive,
    isSubscriptionActive,
    needsUpgrade,
    isLoading,
    error,
    mutate,
  };
} 