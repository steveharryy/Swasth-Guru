import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { PWAInstaller } from '@/components/pwa-installer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SwasthGuru - Telemedicine for Rural India',
  description: 'Comprehensive healthcare platform connecting patients with qualified doctors through video consultations, appointment booking, and medical record management.',
  keywords: 'telemedicine, healthcare, rural India, doctor consultation, medical records',
  authors: [{ name: 'SwasthGuru Team' }],
  manifest: '/manifest.json',
  themeColor: '#5D5CDE',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={cn(inter.className, 'antialiased min-h-screen')}>
        <Providers>
          {children}
          <PWAInstaller />
        </Providers>
      </body>
    </html>
  );
}