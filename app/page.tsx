'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { WelcomeScreen } from '@/components/welcome-screen';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      if (user.unsafeMetadata?.role) {
        router.push(`/${user.unsafeMetadata.role}/dashboard`);
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, isLoaded, router]);

  if (isLoaded && user) {
    return null; // Will redirect
  }

  return <WelcomeScreen />;
}
