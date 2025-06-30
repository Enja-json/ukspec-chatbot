import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { ChatSDKError } from './errors';

export async function requireRegisteredUser() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }
  
  return {
    userId: session.user.id,
    email: session.user.email!,
  };
}

export async function getOptionalRegisteredUser() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  return {
    userId: session.user.id,
    email: session.user.email!,
  };
} 