'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { WelcomeScreen } from '@/components/welcome-screen';

export default function HomePage() {
  const router = useRouter();
  const { user, isDoctor } = useAuth();

  useEffect(() => {
    if (user) {
      router.push(isDoctor ? '/doctor/dashboard' : '/patient/dashboard');
    }
  }, [user, isDoctor, router]);

  if (user) {
    return null; // Will redirect
  }

  return <WelcomeScreen />;
}