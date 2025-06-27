import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { CompetencyAnalyticsContent } from '@/components/competency-analytics-content';

export const metadata = {
  title: 'Competency Analytics - Mini Mentor',
  description: 'Analyse your engineering competency distribution and track your progress towards UK chartership',
};

export default async function CompetencyAnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <CompetencyAnalyticsContent session={session} />;
} 