'use client';

import { useEffect, useState } from 'react';
import { useNextStep } from 'nextstepjs';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  userName?: string;
}

export function OnboardingTutorial({ isOpen, onComplete, onSkip, userName }: OnboardingTutorialProps) {
  const [showAddToLogTutorial, setShowAddToLogTutorial] = useState(false);
  const { startNextStep, closeNextStep, currentTour, currentStep } = useNextStep();

  // Start main tutorial when opened
  useEffect(() => {
    if (isOpen && !showAddToLogTutorial) {
      startNextStep("mini-mentor-onboarding");
    }
  }, [isOpen, showAddToLogTutorial, startNextStep]);

  // Listen for add to competency log button appearance
  useEffect(() => {
    if (!isOpen) return;

    const checkForAddButton = () => {
      const addButton = document.querySelector('[data-testid="add-to-competency-log"]');
      if (addButton && !showAddToLogTutorial && currentTour !== "add-to-competency-log") {
        // Wait a moment for any animations to complete
        setTimeout(() => {
          setShowAddToLogTutorial(true);
          startNextStep("add-to-competency-log");
        }, 500);
      }
    };

    // Check periodically for the add button
    const interval = setInterval(checkForAddButton, 1000);
    return () => clearInterval(interval);
  }, [isOpen, showAddToLogTutorial, startNextStep, currentTour]);

  // Handle tour completion
  useEffect(() => {
    // When main tutorial is done (no current tour) and we haven't shown add-to-log tutorial
    if (isOpen && !currentTour && !showAddToLogTutorial) {
      // Main tutorial completed, wait for UKSPEC analysis
      return;
    }
    
    // When add-to-log tutorial is completed
    if (showAddToLogTutorial && !currentTour) {
      onComplete();
    }
  }, [currentTour, isOpen, showAddToLogTutorial, onComplete]);

  // Handle skip
  useEffect(() => {
    if (!isOpen) {
      closeNextStep();
    }
  }, [isOpen, closeNextStep]);

  // If not open, don't render
  if (!isOpen) return null;

  return null; // NextStep handles rendering through its provider
}

export function useAddToLogTutorial() {
  const { startNextStep } = useNextStep();
  
  return () => {
    // Trigger the add-to-log tutorial when called
    const addButton = document.querySelector('[data-testid="add-to-competency-log"]');
    if (addButton) {
      addButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      startNextStep("add-to-competency-log");
    }
  };
} 