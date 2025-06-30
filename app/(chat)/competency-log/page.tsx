import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { CompetencyLogContent } from '@/components/competency-log-content';

export const metadata = {
  title: 'Competency Log - Mini Mentor',
  description: 'Track your engineering competencies and progress towards UK chartership',
};

export default async function CompetencyLogPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <CompetencyLogContent session={session} />;
} 