'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Volume2, Smartphone, Shield, Clock } from 'lucide-react';

export function WelcomeScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const punjabiAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Safe: runs only in the browser
    punjabiAudioRef.current = new Audio('/audio/welcome.mp3');
    punjabiAudioRef.current.preload = 'auto';
  }, []);

  const speakText = (text: string) => {
    if (language === 'punjabi') {
      // Try TTS first
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        const paVoice = voices.find(v => v.lang.startsWith('pa'));
        if (paVoice) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'pa-IN';
          utterance.voice = paVoice;
          speechSynthesis.cancel();
          speechSynthesis.speak(utterance);
          return;
        }
      }
      // Fallback to preloaded audio
      punjabiAudioRef.current?.play().catch(err =>
        console.error('Audio play failed:', err)
      );
      return;
    }

    // English/Hindi TTS
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hindi' ? 'hi-IN' : 'en-IN';
      speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech Synthesis not supported in this browser.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 gradient-bg">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md mx-auto space-y-8 fade-in">
        {/* Logo and Tagline */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
              <img
                src="/logo.png"
                alt="SwasthGuru Logo"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold logo-text">SwasthGuru</h1>
          <p className="text-lg text-muted-foreground">{t('tagline')}</p>
        </div>

        {/* Language Selection */}
        <Card className="p-6 glass-effect">
          <h2 className="text-xl font-semibold mb-4 text-center">
            {t('chooseLanguage')}
          </h2>
          <div className="grid gap-3 mb-4">
            {[
              { code: 'english', name: 'English', flag: '🇺🇸' },
              { code: 'hindi', name: 'हिंदी', flag: '🇮🇳' },
              { code: 'punjabi', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
            ].map((lang) => (
              <Button
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                variant={language === lang.code ? 'default' : 'outline'}
                className="justify-start h-12 text-left"
              >
                <span className="mr-3 text-xl">{lang.flag}</span>
                {lang.name}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => speakText(t('welcome'))}
            variant="ghost"
            className="w-full"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            {t('speakText') || 'Speak Text'}
          </Button>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Video Consultation</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <p className="text-xs text-muted-foreground">Secure & Private</p>
          </div>
          <div className="space-y-2">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">24/7 Available</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => router.push('/auth/role-select')} size="lg" className="h-14">
            {t('login')}
          </Button>
          <Button
            onClick={() => router.push('/auth/role-select')}
            variant="outline"
            size="lg"
            className="h-14"
          >
            {t('register')}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          SwasthGuru 2024 • Telemedicine for Rural India
        </div>
      </div>
    </div>
  );
}

