'use client';

import React from 'react';
import { Step } from 'nextstepjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface TutorialCardProps {
  step: Step;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  skipTour?: () => void;
  arrow: React.ReactNode;
}

const TutorialCard = ({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: TutorialCardProps) => {
  return (
    <Card 
      className="w-[420px] shadow-lg bg-background border-border nextstep-card"
      style={{ 
        backgroundColor: 'hsl(var(--background))',
        borderColor: 'hsl(var(--border))'
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          {step.icon && <span className="text-xl">{step.icon}</span>}
          <span className="text-lg font-semibold">{step.title}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="text-muted-foreground text-sm leading-relaxed mb-3">
          {step.content}
        </div>
        {arrow}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}
        </div>
        
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevStep}
              className="bg-transparent border-border text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Previous
            </Button>
          )}
          
          <Button 
            size="sm" 
            onClick={nextStep}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
          </Button>
          
          {step.showSkip && skipTour && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={skipTour}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              Skip
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TutorialCard; 