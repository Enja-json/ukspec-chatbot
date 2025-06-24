import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { ChatSDKError } from './errors';

export async function requireRegisteredUser() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }
  
  // Check if user is a guest (guest emails start with 'guest-')
  if (session.user.email?.startsWith('guest-')) {
    throw new ChatSDKError(
      'forbidden:auth',
      'Competency logging is only available for registered users. Please create an account.',
    );
  }
  
  return {
    userId: session.user.id,
    email: session.user.email!,
  };
}

export async function getOptionalRegisteredUser() {
  const session = await auth();
  
  if (!session?.user?.id || session.user.email?.startsWith('guest-')) {
    return null;
  }
  
  return {
    userId: session.user.id,
    email: session.user.email!,
  };
} 