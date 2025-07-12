import { cookies } from 'next/headers';
import { NextStepProvider, NextStep } from 'nextstepjs';
import Script from 'next/script';
import type { Tour } from 'nextstepjs';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@/app/(auth)/auth';
import { OnboardingHandler } from '@/components/onboarding-handler';
import { TutorialHandler } from '@/components/tutorial-handler';
import { PaywallProvider } from '@/components/paywall-provider';
import { PaywallModalHandler } from '@/components/paywall-modal-handler';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  // Define tutorial steps directly in the layout
  const tutorialSteps: Tour[] = [
    {
      tour: "mini-mentor-onboarding",
      steps: [
        {
          icon: '👋',
          title: "Welcome to Mini Mentor!",
          content: "Let's start by showing you how to switch between our two AI models!",
          selector: '[data-testid="model-selector"]',
        },
        {
          icon: '📊',
          title: "Your Competency Log",
          content: "This is where you'll track your progress towards UK chartership.",
          selector: 'a[href="/competency-log"]',
        },
        {
          icon: '💬',
          title: "Chat History",
          content: "Your past conversations will appear in this section for easy reference.",
          selector: '[data-testid="sidebar-history"]',
        },
        {
          icon: '🔍',
          title: "Try the UKSPEC Analyser!",
          content: "Now let's see the competency analysis in action. Try asking the UKSPEC model to analyse some of your work!",
          selector: 'body',
        }
      ]
    },
    {
      tour: "add-to-competency-log",
      steps: [
        {
          icon: '🎉',
          title: "Perfect!",
          content: "Now click this button to automatically add this competency analysis to your log.",
          selector: '[data-testid="add-to-competency-log"]',
        }
      ]
    }
  ];

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <NextStepProvider>
        <NextStep steps={tutorialSteps}>
          <PaywallProvider>
            <SidebarProvider defaultOpen={!isCollapsed}>
              <AppSidebar user={session?.user} />
              <SidebarInset>{children}</SidebarInset>
              <OnboardingHandler />
              <TutorialHandler />
              <PaywallModalHandler />
            </SidebarProvider>
          </PaywallProvider>
        </NextStep>
      </NextStepProvider>
    </>
  );
}
