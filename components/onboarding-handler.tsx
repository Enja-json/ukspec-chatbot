'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { OnboardingModal } from './onboarding-modal';
import { useOnboarding } from '@/hooks/use-onboarding';

export function OnboardingHandler() {
  const { data: session } = useSession();
  const { completeOnboarding, isLoading } = useOnboarding();
  const [isCompleted, setIsCompleted] = useState(false);

  // Only show modal if user is authenticated, hasn't completed onboarding, and hasn't been completed in this session
  const shouldShowOnboarding = Boolean(
    session?.user?.id && 
    session.user.onboardingCompleted === false &&
    !isCompleted
  );

  const handleComplete = async (data: {
    registrationTitle: 'still-learning' | 'engtech' | 'ieng' | 'ceng';
    careerGoals: string;
    currentPosition: string;
  }) => {
    try {
      await completeOnboarding(data);
      setIsCompleted(true); // Hide the modal immediately
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleClose = () => {
    // Onboarding is unskippable - user must complete it
    // This function exists to satisfy the modal interface but does nothing
  };

  return (
    <OnboardingModal
      isOpen={shouldShowOnboarding}
      onClose={handleClose}
      onComplete={handleComplete}
      isLoading={isLoading}
    />
  );
} 