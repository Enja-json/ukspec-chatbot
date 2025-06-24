'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: 'signup' | 'rate-limit';
  onStartTrial: (priceId: string) => void;
  isLoading?: boolean;
}

export function PaywallModal({ isOpen, onClose, trigger, onStartTrial, isLoading = false }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const plans = {
    monthly: {
      priceId: 'price_1RajA9PsTCOo0fiqqAZs8mKk',
      price: '£9.99',
      period: 'month',
      savings: null,
    },
    yearly: {
      priceId: 'price_1RajA9PsTCOo0fiqznY8qN6b',
      price: '£69.99',
      period: 'year',
      savings: 'Save £49.89',
    },
  };

  const features = [
    'Unlimited Mini Mentor conversations',
    'Unlimited UK-SPEC Competency Analysis',
    'Competency tracking dashboard',
    'Monthly progress reports via email',
    'Export your progress (PDF & Excel)',
    '14-day free trial',
  ];

  const getTitle = () => {
    if (trigger === 'rate-limit') {
      return "You've reached your message limit";
    }
    return 'Unlock Your Engineering Potential';
  };

  const getDescription = () => {
    if (trigger === 'rate-limit') {
      return 'Upgrade to Professional to continue your chartership journey with unlimited access.';
    }
    return 'Start your 14-day free trial and accelerate your UK engineering chartership.';
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[500px] p-0 border-0">
        {/* Header */}
        <AlertDialogHeader className="p-8 pb-6 text-center">
          <AlertDialogTitle className="text-2xl font-semibold text-foreground mb-3">
            {getTitle()}
          </AlertDialogTitle>
          
          <p className="text-muted-foreground text-base leading-relaxed">
            {getDescription()}
          </p>
        </AlertDialogHeader>

        <div className="px-8 pb-8">
          {/* Plan Selection */}
          <div className="mb-8">
            <div className="flex gap-2 p-1.5 bg-muted rounded-lg">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  selectedPlan === 'monthly'
                    ? 'bg-background text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
                              <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 relative ${
                    selectedPlan === 'yearly'
                      ? 'bg-background text-foreground shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                    Save
                  </span>
                </button>
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-foreground mb-2">
              {plans[selectedPlan].price}
            </div>
            <div className="text-muted-foreground">
              per {plans[selectedPlan].period}
            </div>
            {plans[selectedPlan].savings && (
              <div className="text-sm text-primary font-medium mt-2">
                {plans[selectedPlan].savings}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => onStartTrial(plans[selectedPlan].priceId)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Starting trial...' : 'Start 14-Day Free Trial'}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-3">
            No charge for 14 days. Cancel anytime.
          </p>

          {/* Features List */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2.5 flex-shrink-0"></div>
                  <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Close */}
          <div className="mt-8 text-center">
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
} 