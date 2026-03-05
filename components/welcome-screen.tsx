'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Volume2, Smartphone, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function WelcomeScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const punjabiAudioRef = useRef<HTMLAudioElement | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Safe: runs only in the browser
    punjabiAudioRef.current = new Audio('/audio/welcome.mp3');
    punjabiAudioRef.current.preload = 'auto';

    // Cache voices
    const updateVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    // Prefetch critical routes for instant transition
    router.prefetch('/onboarding');
    router.prefetch('/patient/dashboard');
  }, [router]);

  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Use a small timeout to ensure the UI updates before speech starts
    setTimeout(() => {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      if (language === 'punjabi') {
        const paVoice = voicesRef.current.find((v: SpeechSynthesisVoice) => v.lang.startsWith('pa'));
        if (paVoice) {
          utterance.lang = 'pa-IN';
          utterance.voice = paVoice;
        } else {
          // Fallback to preloaded audio if no Punjabi voice
          punjabiAudioRef.current?.play().catch((err: Error) =>
            console.error('Audio play failed:', err)
          );
          return;
        }
      } else {
        utterance.lang = language === 'hindi' ? 'hi-IN' : 'en-IN';
      }

      speechSynthesis.speak(utterance);
    }, 10); // Small but non-zero delay for UI responsiveness
  }, [language]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-background text-foreground overflow-hidden">
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto space-y-10">
        {/* Logo and Tagline */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shadow-none border">
              <img
                src="/logo.png"
                alt="SwasthGuru Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tight">SwasthGuru</h1>
          <p className="text-base text-muted-foreground font-bold italic max-w-[280px] mx-auto leading-relaxed">
            {t('tagline')}
          </p>
        </div>

        {/* Language Selection */}
        <Card className="p-6 shadow-none border bg-card">
          <h2 className="text-sm font-bold mb-6 text-center text-muted-foreground uppercase tracking-widest">
            {t('chooseLanguage')}
          </h2>
          <div className="grid gap-3 mb-6">
            {[
              { code: 'english', name: 'English', flag: '🇺🇸' },
              { code: 'hindi', name: 'हिंदी', flag: '🇮🇳' },
              { code: 'punjabi', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
            ].map((lang) => (
              <Button
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                variant={language === lang.code ? 'default' : 'secondary'}
                className={cn(
                  "w-full justify-between h-12 text-sm font-bold transition-all rounded-xl",
                  language === lang.code ? "shadow-md bg-primary text-primary-foreground" : "bg-muted/30"
                )}
              >
                <span className="flex items-center">
                  <span className="mr-3 text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
                {language === lang.code && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => speakText(t('welcome'))}
            variant="ghost"
            className="w-full h-10 text-muted-foreground hover:text-primary text-[11px] font-bold uppercase tracking-wider"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            <span>{t('speakText') || 'Listen to Welcome'}</span>
          </Button>
        </Card>

        {/* Hero Features (Simplified) */}
        <div className="grid grid-cols-3 gap-4 py-2">
          {[
            { icon: Smartphone, label: 'Video Call', color: 'text-primary bg-primary/10' },
            { icon: Shield, label: 'Secure', color: 'text-secondary bg-secondary/10' },
            { icon: Clock, label: '24/7 Support', color: 'text-accent bg-accent/10' },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", feature.color)}>
                <feature.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-tighter">{feature.label}</p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-2">
          <Button
            size="lg"
            variant="premium"
            className="w-full sm:w-auto px-10 h-14 text-lg font-bold rounded-2xl"
            onClick={() => router.push('/onboarding')}
          >
            Login / Register
          </Button>
          <p className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Supporting Rural India's Health
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground font-bold pt-6 uppercase tracking-[0.2em]">
          SwasthGuru &copy; 2024
        </div>
      </div>
    </div>
  );
}
