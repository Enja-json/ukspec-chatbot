import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getUserEntitlements } from '@/lib/ai/entitlements';
import type { SubscriptionStatus } from '@/lib/stripe/config';

interface UserEntitlements {
  maxMessagesPerMonth: {
    'mini-mentor-model': number;
    'uk-spec-competency-model': number;
  };
  availableChatModelIds: string[];
  canExportCompetencyLog: boolean;
  canExportAnalyticsPDF: boolean;
  maxCompetencyTasks: number;
}

export function useUserEntitlements() {
  const { data: session, status } = useSession();
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEntitlements() {
      if (status === 'loading') return;
      
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user subscription status
        const response = await fetch('/api/user/details');
        let userSubscriptionStatus: SubscriptionStatus = 'none';
        
        if (response.ok) {
          const userData = await response.json();
          userSubscriptionStatus = userData.subscriptionStatus || 'none';
          setSubscriptionStatus(userSubscriptionStatus);
        }

        // Calculate entitlements
        const userType = session.user.type || 'regular';
        const userEntitlements = getUserEntitlements(userType, userSubscriptionStatus);
        setEntitlements(userEntitlements);
      } catch (error) {
        console.error('Failed to fetch user entitlements:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEntitlements();
  }, [session, status]);

  return {
    entitlements,
    subscriptionStatus,
    loading,
    isAuthenticated: !!session?.user,
    isProfessional: subscriptionStatus === 'trial' || subscriptionStatus === 'active',
  };
} 