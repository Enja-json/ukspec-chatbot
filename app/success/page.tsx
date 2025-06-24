'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a brief loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Welcome to Professional!</h1>
          <p className="text-muted-foreground">
            Your 14-day free trial has started. You now have unlimited access to both AI models.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Unlimited Mini Mentor conversations</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Unlimited UK-SPEC Competency Analysis</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Competency tracking dashboard (coming soon)</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/')} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Chatting
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/account')} 
            className="w-full"
          >
            Manage Subscription
          </Button>
        </div>

                  <p className="text-xs text-muted-foreground mt-6">
            Your trial ends in 14 days. We&apos;ll send you a reminder before it expires.
          </p>
              </Card>
      </div>
    );
  }

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
} 