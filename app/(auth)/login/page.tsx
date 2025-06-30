'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/components/toast';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Page() {
  const router = useRouter();
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);

  const handleLinkedInSignIn = async () => {
    setIsLinkedInLoading(true);
    try {
      await signIn('linkedin', { callbackUrl: '/' });
    } catch (error) {
      console.error('LinkedIn sign-in error:', error);
      toast({
        type: 'error',
        description: 'Failed to sign in with LinkedIn',
      });
    } finally {
      setIsLinkedInLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image
              src="/images/logoweb.png"
              alt="Mini Mentor"
              fill
              sizes="32px"
              className="object-contain rounded-lg"
              priority
            />
          </div>
          <span className="text-xl font-semibold">Mini Mentor</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-light leading-tight">
              What if AI could help you achieve{' '}
              <span 
                className="font-medium"
                style={{ color: '#2B9CA8' }}
              >
                UK Chartership
              </span>{' '}
              faster?
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Mini Mentor supercharges your engineering development with AI guidance that
              works 24/7 on your competency journey - using advanced AI models
            </p>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <Button
              onClick={handleLinkedInSignIn}
              disabled={isLinkedInLoading}
              className="px-8 py-4 text-lg font-medium rounded-xl transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: '#2B9CA8',
                color: 'white'
              }}
            >
              {isLinkedInLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Continue with LinkedIn
                </div>
              )}
            </Button>
            
            <p className="text-sm text-gray-400">
              Join <span style={{ color: '#2B9CA8' }}>1,000+</span> engineers already using Mini Mentor
            </p>
          </div>

          {/* Video Section */}
          <div className="mt-12">
            <div className="relative mx-auto max-w-2xl">
              <div className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-2xl">
                <div className="aspect-video">
                  {/* Placeholder for YouTube video */}
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="Welcome to Mini Mentor"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-2xl"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-white transition-colors">
            privacy policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            terms of service
          </Link>
          <span>we're hiring!</span>
        </div>
      </footer>
    </div>
  );
}
