'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
  isLoading?: boolean;
}

interface OnboardingData {
  registrationTitle: 'still-learning' | 'engtech' | 'ieng' | 'ceng';
  careerGoals: string;
  currentPosition: string;
}

interface FormErrors {
  registrationTitle?: string;
  careerGoals?: string;
  currentPosition?: string;
}

const registrationOptions = [
  { value: 'still-learning', label: 'Still learning', description: "I'm exploring engineering and learning the basics" },
  { value: 'engtech', label: 'EngTech', description: 'Engineering Technician - practical application of engineering' },
  { value: 'ieng', label: 'IEng', description: 'Incorporated Engineer - established engineering principles' },
  { value: 'ceng', label: 'CEng', description: 'Chartered Engineer - complex engineering challenges' },
] as const;

export function OnboardingModal({ isOpen, onClose, onComplete, isLoading = false }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    registrationTitle: 'still-learning',
    careerGoals: '',
    currentPosition: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const totalSteps = 4;

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 2) {
      if (!formData.registrationTitle) {
        newErrors.registrationTitle = 'Please select your registration goal';
      }
    } else if (step === 3) {
      if (!formData.careerGoals.trim()) {
        newErrors.careerGoals = 'Please describe your career goals';
      } else if (formData.careerGoals.trim().length < 40) {
        newErrors.careerGoals = 'Please provide more detail (at least 40 characters)';
      }
    } else if (step === 4) {
      if (!formData.currentPosition.trim()) {
        newErrors.currentPosition = 'Please describe your current position';
      } else if (formData.currentPosition.trim().length < 40) {
        newErrors.currentPosition = 'Please provide more detail (at least 40 characters)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === totalSteps) {
        onComplete(formData);
      } else {
        setCurrentStep(prev => prev + 1);
        setErrors({});
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };

  const handleClose = () => {
    // Remove the ability to close the modal - it's unskippable
    // Only allow closing when onboarding is completed via onComplete
    return;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Welcome to Mini Mentor! 👋
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="text-base leading-relaxed">
                  Let&apos;s get you set up for success on your engineering chartership journey.
                </p>
                <p className="text-sm">
                  The more context you provide, the better I can tailor my guidance to your specific needs. 
                  Don&apos;t worry - you can update these details at any time.
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                What&apos;s your registration goal?
              </h2>
              <p className="text-sm text-muted-foreground">
                This helps me understand where you are in your journey
              </p>
            </div>
            
            <div className="space-y-3">
              {registrationOptions.map((option) => (
                <label
                  key={option.value}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                    formData.registrationTitle === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background'
                  }`}
                >
                  <input
                    type="radio"
                    name="registrationTitle"
                    value={option.value}
                    checked={formData.registrationTitle === option.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, registrationTitle: e.target.value as any }))}
                    className="sr-only"
                  />
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
            
            {errors.registrationTitle && (
              <p className="text-sm text-red-600">{errors.registrationTitle}</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Tell me about your career goals
              </h2>
              <p className="text-sm text-muted-foreground">
                What are you hoping to achieve in your engineering career?
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="careerGoals" className="text-sm font-medium">
                Your goals and aspirations
              </Label>
              <Textarea
                id="careerGoals"
                placeholder="e.g., I want to become a chartered engineer specialising in renewable energy systems, lead technical teams, and contribute to sustainable infrastructure projects..."
                value={formData.careerGoals}
                onChange={(e) => setFormData(prev => ({ ...prev, careerGoals: e.target.value }))}
                className="min-h-[120px] resize-none"
                maxLength={500}
              />
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  {errors.careerGoals ? (
                    <span className="text-red-600">{errors.careerGoals}</span>
                  ) : (
                    "Share your aspirations, interests, and long-term objectives"
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formData.careerGoals.length}/500
                </span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Describe your current position
              </h2>
              <p className="text-sm text-muted-foreground">
                Help me understand where you are right now in your career
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentPosition" className="text-sm font-medium">
                Your current role and experience
              </Label>
              <Textarea
                id="currentPosition"
                placeholder="e.g., I'm a junior mechanical engineer working on HVAC systems for commercial buildings. I've been in this role for 18 months and have experience with AutoCAD, system design calculations, and site inspections..."
                value={formData.currentPosition}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPosition: e.target.value }))}
                className="min-h-[120px] resize-none"
                maxLength={500}
              />
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  {errors.currentPosition ? (
                    <span className="text-red-600">{errors.currentPosition}</span>
                  ) : (
                    "Include your role, experience level, key responsibilities, and skills"
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formData.currentPosition.length}/500
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-[600px] p-0 border-0">
        {/* Progress indicator */}
        <div className="w-full bg-muted h-1">
          <div 
            className="bg-primary h-1 transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Header */}
        <AlertDialogHeader className="p-8 pb-6">
          <AlertDialogTitle className="sr-only">
            Onboarding Step {currentStep} of {totalSteps}
          </AlertDialogTitle>
        </AlertDialogHeader>

        {/* Content */}
        <div className="px-8 pb-8">
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>

            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="px-6"
                >
                  Back
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="px-6"
              >
                {isLoading ? (
                  'Saving...'
                ) : currentStep === totalSteps ? (
                  "Let's get started!"
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </div>

          {/* Skip option */}
          {/* Removed skip option - modal is unskippable */}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
} 