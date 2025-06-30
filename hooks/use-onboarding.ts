import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/toast';

interface OnboardingData {
  registrationTitle: 'still-learning' | 'engtech' | 'ieng' | 'ceng';
  careerGoals: string;
  currentPosition: string;
}

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(false);
  const { update } = useSession();

  const completeOnboarding = async (data: OnboardingData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete onboarding');
      }

      const result = await response.json();
      
      toast({
        type: 'success',
        description: 'Welcome to Mini Mentor! Your profile has been set up successfully.',
      });

      // Update the session to reflect the onboarding completion
      await update({
        onboardingCompleted: true,
      });
      
      return result;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : 'Failed to complete onboarding. Please try again.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    completeOnboarding,
    isLoading,
  };
} 