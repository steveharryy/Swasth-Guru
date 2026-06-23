import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { ClerkProvider } from '@clerk/nextjs';

const outfit = Outfit({ subsets: ['latin'], weight: ['400','500','600','700','800','900'] });

export const metadata: Metadata = {
  title: 'SwasthGuru - Telemedicine for Rural India',
  description: 'Comprehensive healthcare platform connecting patients with qualified doctors through video consultations, appointment booking, and medical record management.',
  keywords: 'telemedicine, healthcare, rural India, doctor consultation, medical records',
  authors: [{ name: 'SwasthGuru Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A8A7A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="hi" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className={cn(outfit.className, 'antialiased min-h-screen')}>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
