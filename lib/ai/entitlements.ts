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
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerMonth: {
      'mini-mentor-model': 5,
      'uk-spec-competency-model': 5,
    },
    availableChatModelIds: ['mini-mentor-model', 'uk-spec-competency-model'],
  },

  /*
   * For users with an account (Basic tier - free)
   */
  regular: {
    maxMessagesPerMonth: {
      'mini-mentor-model': 30,
      'uk-spec-competency-model': 5,
    },
    availableChatModelIds: ['mini-mentor-model', 'uk-spec-competency-model'],
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
  },
};

// Get user entitlements based on user type and subscription status
export function getUserEntitlements(userType: UserType, subscriptionStatus?: SubscriptionStatus): Entitlements {
  // Professional subscribers (trial or active) get professional entitlements
  if (subscriptionStatus === 'trial' || subscriptionStatus === 'active') {
    return entitlementsByUserType.professional;
  }
  
  // Otherwise use the base user type entitlements
  return entitlementsByUserType[userType];
}
