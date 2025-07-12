'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { OnboardingTutorial } from './onboarding-tutorial';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';

export function TutorialHandler() {
  const { data: session, update } = useSession();
  const { mutate } = useSWRConfig();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset completion state when user changes
  useEffect(() => {
    setIsCompleted(false);
  }, [session?.user?.id]);

  // Additional safety check with localStorage backup
  useEffect(() => {
    if (session?.user?.id) {
      const tutorialCompletedKey = `tutorial-completed-${session.user.id}`;
      const localCompleted = localStorage.getItem(tutorialCompletedKey) === 'true';
      if (localCompleted) {
        setIsCompleted(true);
      }
    }
  }, [session?.user?.id]);

  // Check if tutorial should be shown - PROPER CONDITIONS RESTORED
  const shouldShowTutorial = Boolean(
    session?.user?.id && 
    session.user.onboardingCompleted === true && // Only show after onboarding is done
    session.user.tutorialCompleted === false && // Haven't completed tutorial yet
    !isCompleted && // Not completed in this session
    !isLoading // Not currently processing completion
  );

  const completeTutorial = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/tutorial-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to complete tutorial');
      }

      // Update session to reflect tutorial completion
      await update({ tutorialCompleted: true });
      
      // Set localStorage backup flag to prevent showing again
      if (session?.user?.id) {
        localStorage.setItem(`tutorial-completed-${session.user.id}`, 'true');
      }
      
      setIsCompleted(true);
      toast.success('Welcome to Mini Mentor! You\'re all set to get started.');
    } catch (error) {
      console.error('Failed to complete tutorial:', error);
      toast.error('Failed to save tutorial completion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const skipTutorial = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/tutorial-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to skip tutorial');
      }

      // Update session to reflect tutorial completion
      await update({ tutorialCompleted: true });
      
      // Set localStorage backup flag to prevent showing again
      if (session?.user?.id) {
        localStorage.setItem(`tutorial-completed-${session.user.id}`, 'true');
      }
      
      setIsCompleted(true);
      toast.success('Tutorial skipped. You can explore Mini Mentor at your own pace!');
    } catch (error) {
      console.error('Failed to skip tutorial:', error);
      toast.error('Failed to save tutorial skip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingTutorial
      isOpen={shouldShowTutorial}
      onComplete={completeTutorial}
      onSkip={skipTutorial}
      userName={session?.user?.name || undefined}
    />
  );
} 