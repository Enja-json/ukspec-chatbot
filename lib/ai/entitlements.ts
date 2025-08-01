import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';
import type { SubscriptionStatus } from '@/lib/stripe/config';

interface ModelLimits {
  'mini-mentor-model': number;
  'uk-spec-competency-model': number;
}

interface Entitlements {
  maxMessagesPerMonth: ModelLimits;
  availableChatModelIds: Array<ChatModel['id']>;
  canExportCompetencyLog: boolean;
  canExportAnalyticsPDF: boolean;
  maxCompetencyTasks: number;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users with an account (Basic tier - free)
   */
  regular: {
    maxMessagesPerMonth: {
      'mini-mentor-model': 30,
      'uk-spec-competency-model': 5,
    },
    availableChatModelIds: ['mini-mentor-model', 'uk-spec-competency-model'],
    canExportCompetencyLog: false,
    canExportAnalyticsPDF: false,
    maxCompetencyTasks: 5,
  },

  /*
   * For users with a paid Professional subscription
   */
  professional: {
    maxMessagesPerMonth: {
      'mini-mentor-model': 999999, // Unlimited
      'uk-spec-competency-model': 999999, // Unlimited
    },
    availableChatModelIds: ['mini-mentor-model', 'uk-spec-competency-model'],
    canExportCompetencyLog: true,
    canExportAnalyticsPDF: true,
    maxCompetencyTasks: 999999, // Unlimited
  },
};

// Get user entitlements based on user type and subscription status
export function getUserEntitlements(userType: UserType, subscriptionStatus?: SubscriptionStatus): Entitlements {
  // Professional subscribers (trial or active) get professional entitlements
  if (subscriptionStatus === 'trial' || subscriptionStatus === 'active') {
    return entitlementsByUserType.professional;
  }
  
  // Otherwise use the base user type entitlements (never allow undefined)
  return entitlementsByUserType[userType] || entitlementsByUserType.regular;
}
