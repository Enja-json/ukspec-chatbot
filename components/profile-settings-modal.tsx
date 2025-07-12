'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Settings, CreditCard, Moon, Sun, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { subscription, isSubscriptionActive, isTrialActive, mutate: refreshSubscription } = useSubscription();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'settings'>('profile');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelSubscription = async () => {
    if (!subscription?.subscriptionId) return;
    
    setIsCancelling(true);
    
    try {
      const response = await fetch('/api/user/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.subscriptionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      await refreshSubscription();
      setShowCancelDialog(false);
      toast.success('Subscription cancelled successfully');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    if (isTrialActive) {
      return <Badge variant="secondary">Trial Active</Badge>;
    }
    if (isSubscriptionActive) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="outline">Free</Badge>;
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-semibold">Profile Settings</DialogTitle>
          </DialogHeader>
          
          <div className="flex">
            {/* Tab Navigation */}
            <div className="w-48 border-r bg-muted/30 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 max-h-[600px] overflow-y-auto">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={session?.user?.name || ''}
                          disabled
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Your name is synced from LinkedIn and cannot be changed here.
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={session?.user?.email || ''}
                          disabled
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Your email is synced from LinkedIn and cannot be changed here.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Onboarding Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="career-goals">Career Goals</Label>
                        <Textarea
                          id="career-goals"
                          value={session?.user?.onboardingData?.careerGoals || ''}
                          disabled
                          className="mt-1 min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Your career goals help personalise your Mini Mentor experience.
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="current-position">Current Position</Label>
                        <Textarea
                          id="current-position"
                          value={session?.user?.onboardingData?.currentPosition || ''}
                          disabled
                          className="mt-1 min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Your current position helps provide more relevant guidance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Current Plan</span>
                          {getStatusBadge()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Status</Label>
                            <p className="text-sm text-muted-foreground capitalize">
                              {subscription?.subscriptionStatus || 'Free'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Subscription ID</Label>
                            <p className="text-sm text-muted-foreground font-mono">
                              {subscription?.subscriptionId || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {subscription?.trialEndsAt && (
                          <div>
                            <Label className="text-sm font-medium">Trial Ends</Label>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(subscription.trialEndsAt)}
                            </p>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2">Features Included</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {(isSubscriptionActive || isTrialActive) ? (
                              <>
                                <li>• Unlimited Mini Mentor conversations</li>
                                <li>• Unlimited UK-SPEC Competency Analysis</li>
                                <li>• Competency tracking dashboard</li>
                                <li>• Monthly progress reports via email</li>
                                <li>• Export your progress (PDF & Excel)</li>
                              </>
                            ) : (
                              <>
                                <li>• 30 Mini Mentor conversations per month</li>
                                <li>• 5 UK-SPEC Competency Analysis per month</li>
                                <li>• Basic competency tracking</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {(isSubscriptionActive || isTrialActive) && subscription?.subscriptionId && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Manage Subscription</h3>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                              <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium mb-2">Cancel Subscription</h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                {isTrialActive 
                                  ? "Cancelling will end your trial immediately and revert you to the free plan."
                                  : "Cancelling will end your subscription at the end of your current billing period. You'll still have access to professional features until then."
                                }
                              </p>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowCancelDialog(true)}
                                className="gap-2"
                              >
                                <Trash2 size={16} />
                                Cancel Subscription
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Theme</Label>
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant={theme === 'light' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('light')}
                                className="gap-2"
                              >
                                <Sun size={16} />
                                Light
                              </Button>
                              <Button
                                variant={theme === 'dark' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('dark')}
                                className="gap-2"
                              >
                                <Moon size={16} />
                                Dark
                              </Button>
                              <Button
                                variant={theme === 'system' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('system')}
                                className="gap-2"
                              >
                                <Settings size={16} />
                                System
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Account</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Account Status</Label>
                            <p className="text-sm text-muted-foreground">
                              Your account is active and linked to LinkedIn.
                            </p>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Data Export</Label>
                            <p className="text-sm text-muted-foreground mb-2">
                              Download your competency data and chat history.
                            </p>
                            <Button variant="outline" size="sm" disabled>
                              Export Data (Coming Soon)
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Cancel Subscription
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? This action cannot be undone.
              
              {isTrialActive ? (
                <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                  <p className="text-sm font-medium text-destructive">
                    Your trial will end immediately and you'll lose access to:
                  </p>
                  <ul className="text-sm text-destructive mt-2 space-y-1">
                    <li>• Unlimited conversations</li>
                    <li>• Advanced competency tracking</li>
                    <li>• Monthly progress reports</li>
                    <li>• Data export features</li>
                  </ul>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    You'll continue to have access to professional features until your current billing period ends.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 