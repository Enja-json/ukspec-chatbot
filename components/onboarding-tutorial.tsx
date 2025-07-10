'use client';

import { useState, useEffect, useCallback } from 'react';
import Joyride, { Step, CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { useRouter } from 'next/navigation';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  userName?: string;
}

// Tutorial steps configuration
const tutorialSteps: Step[] = [
  {
    target: '[data-testid="model-selector"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Welcome to Mini Mentor! 👋</h3>
        <p className="text-gray-700">
          Let's start by showing you how to switch between our two AI models:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
              MENTOR
            </span>
            <span>Career guidance and mentorship</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              UK-SPEC
            </span>
            <span>Competency analysis and mapping</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          Click here to switch between models anytime!
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    styles: {
      options: {
        primaryColor: '#2B9CA8',
      }
    }
  },
  {
    target: 'a[href="/competency-log"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Your Competency Log 📊</h3>
        <p className="text-gray-700">
          This is where you'll track your progress towards UK chartership.
        </p>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Store competency evidence and analysis</p>
          <p>• Track your development across all UK-SPEC areas</p>
          <p>• Export data for your chartership application</p>
        </div>
        <p className="text-gray-600 text-sm font-medium">
          All your competency work will be organised here!
        </p>
      </div>
    ),
    placement: 'right',
    styles: {
      options: {
        primaryColor: '#2B9CA8',
      }
    }
  },
  {
    target: '[data-testid="sidebar-history"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Chat History 💬</h3>
        <p className="text-gray-700">
          Your past conversations will appear in this section for easy reference.
        </p>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Access previous Mini Mentor guidance sessions</p>
          <p>• Review past competency analyses</p>
          <p>• Continue conversations where you left off</p>
        </div>
        <p className="text-gray-600 text-sm font-medium">
          Never lose track of important discussions!
        </p>
      </div>
    ),
    placement: 'right',
    styles: {
      options: {
        primaryColor: '#2B9CA8',
      }
    }
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Try the UKSPEC Analyser! 🔍</h3>
        <p className="text-gray-700">
          Now let's see the competency analysis in action. Try asking the UKSPEC model to analyse some of your work!
        </p>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm font-medium text-gray-800 mb-2">Example prompt:</p>
          <p className="text-sm text-gray-600 italic">
            "I led a team of 5 engineers on a bridge design project, managing the budget of £2M and ensuring compliance with Eurocodes. We delivered the project 2 weeks ahead of schedule."
          </p>
        </div>
        <p className="text-gray-600 text-sm">
          After you get a competency analysis, we'll show you something special! ✨
        </p>
      </div>
    ),
    placement: 'center',
    styles: {
      options: {
        primaryColor: '#2B9CA8',
      }
    }
  }
];

// Special step for the add to competency log button (shown contextually)
const addToLogStep: Step = {
  target: '[data-testid="add-to-competency-log"]',
  content: (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Perfect! 🎉</h3>
      <p className="text-gray-700">
        Now click this button to automatically add this competency analysis to your log.
      </p>
      <div className="space-y-2 text-sm text-gray-600">
        <p>• Saves the analysis to your competency portfolio</p>
        <p>• Links to the specific conversation for context</p>
        <p>• Helps build evidence for your chartership application</p>
      </div>
      <p className="text-gray-600 text-sm font-medium">
        This saves you time by automatically organising your competency evidence!
      </p>
    </div>
  ),
  placement: 'top',
  styles: {
    options: {
      primaryColor: '#2B9CA8',
    }
  }
};

export function OnboardingTutorial({ isOpen, onComplete, onSkip, userName }: OnboardingTutorialProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(false);
  const [showAddToLogTutorial, setShowAddToLogTutorial] = useState(false);
  const router = useRouter();

  // Start tutorial when opened
  useEffect(() => {
    if (isOpen) {
      setRun(true);
      setStepIndex(0);
    }
  }, [isOpen]);

  // Listen for add to competency log button appearance
  useEffect(() => {
    if (!isOpen) return;

    const checkForAddButton = () => {
      const addButton = document.querySelector('[data-testid="add-to-competency-log"]');
      if (addButton && !showAddToLogTutorial) {
        // Wait a moment for any animations to complete
        setTimeout(() => {
          setShowAddToLogTutorial(true);
          setRun(true);
          setStepIndex(0); // Reset for the add button tutorial
        }, 500);
      }
    };

    // Check periodically for the add button
    const interval = setInterval(checkForAddButton, 1000);
    return () => clearInterval(interval);
  }, [isOpen, showAddToLogTutorial]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (type === EVENTS.STEP_AFTER) {
      // Move to next step
      setStepIndex(index + 1);
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      if (showAddToLogTutorial) {
        // Completed the add to log tutorial
        setShowAddToLogTutorial(false);
        setRun(false);
        onComplete();
      } else {
        // Completed main tutorial, wait for UKSPEC analysis
        setRun(false);
        if (status === STATUS.SKIPPED) {
          onSkip();
        }
        // Keep tutorial system active for the add button tutorial
      }
    }

    // Handle manual navigation
    if (action === 'next' && index === 3) {
      // After showing the "Try UKSPEC analyser" step, prepare for UKSPEC prompt
      setRun(false);
      // Tutorial will resume when add button appears
    }
  }, [showAddToLogTutorial, onComplete, onSkip]);

  // If not open, don't render
  if (!isOpen) return null;

  // Determine which steps to show
  const currentSteps = showAddToLogTutorial ? [addToLogStep] : tutorialSteps;

  return (
    <Joyride
      steps={currentSteps}
      run={run}
      stepIndex={stepIndex}
      continuous={true}
      showProgress={true}
      showSkipButton={!showAddToLogTutorial} // Only show skip for main tutorial
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#2B9CA8',
          backgroundColor: '#ffffff',
          textColor: '#374151',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
          fontSize: 16,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#2B9CA8',
          borderRadius: 8,
          fontSize: 14,
          padding: '8px 16px',
          fontWeight: 500,
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: 'auto',
          fontSize: 14,
          padding: '8px 16px',
        },
        buttonSkip: {
          color: '#6B7280',
          fontSize: 14,
          padding: '8px 16px',
        },
        buttonClose: {
          display: 'none', // Hide close button to encourage completion
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: showAddToLogTutorial ? 'Finish Tutorial' : 'Got it!',
        next: 'Next',
        skip: 'Skip Tutorial',
      }}
    />
  );
}

// Hook for components to trigger the add to log tutorial step
export function useAddToLogTutorial() {
  const triggerAddToLogTutorial = useCallback(() => {
    // This will be called when the add button appears
    // The tutorial component listens for the button via DOM queries
    const addButton = document.querySelector('[data-testid="add-to-competency-log"]');
    if (addButton) {
      // Ensure the button is visible and ready for tutorial
      addButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return { triggerAddToLogTutorial };
} 