'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';

import { LanguageProvider } from '@/contexts/language-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LanguageProvider>
        <NotificationProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}