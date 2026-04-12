'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { VibrantBackground } from '@/components/ui/vibrant-background';
import { Volume2, Smartphone, Shield, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';

export function WelcomeScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const punjabiAudioRef = useRef<HTMLAudioElement | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    punjabiAudioRef.current = new Audio('/audio/welcome.mp3');
    punjabiAudioRef.current.preload = 'auto';

    const updateVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    router.prefetch('/onboarding');
  }, [router]);

  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    setTimeout(() => {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (language === 'punjabi') {
        const paVoice = voicesRef.current.find((v: SpeechSynthesisVoice) => v.lang.startsWith('pa'));
        if (paVoice) {
          utterance.lang = 'pa-IN';
          utterance.voice = paVoice;
        } else {
          punjabiAudioRef.current?.play().catch((err: Error) => console.error(err));
          return;
        }
      } else {
        utterance.lang = language === 'hindi' ? 'hi-IN' : 'en-IN';
      }
      speechSynthesis.speak(utterance);
    }, 10);
  }, [language]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
      <VibrantBackground />


      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg mx-auto space-y-12 relative z-10"
      >

        {/* Logo and Tagline */}
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center justify-center mb-8"
          >

            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center border border-slate-100 shadow-xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain relative z-10" />
            </div>
          </motion.div>

          
          <h1 className="text-6xl font-black logo-text tracking-tighter sm:text-7xl">
            SwasthGuru
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg font-bold text-slate-400 max-w-[320px] mx-auto leading-relaxed"
          >
            {t('tagline')}
          </motion.p>

        </div>

        {/* Action Card */}
        <div className="bg-white/80 backdrop-blur-3xl border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.05)] rounded-[2.5rem] p-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 animate-spin-slow">
              <Sparkles className="w-24 h-24 text-primary" />
           </div>

           <div className="relative z-10 space-y-8">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-center mb-10">
                {t('chooseLanguage')}
              </h2>

              <div className="grid gap-4">
                {[
                  { code: 'english', name: 'English', flag: '🇺🇸' },
                  { code: 'hindi', name: 'हिंदी', flag: '🇮🇳' },
                  { code: 'punjabi', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
                ].map((lang, idx) => (
                  <motion.div
                    key={lang.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.05) }}
                  >

                    <Button
                      onClick={() => setLanguage(lang.code as any)}
                      variant={language === lang.code ? 'default' : 'secondary'}
                      className={cn(
                        "w-full justify-between h-18 text-lg font-black transition-all rounded-2xl relative overflow-hidden group border",
                        language === lang.code 
                          ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02] border-transparent" 
                          : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center">
                        <span className="mr-5 text-2xl">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                      {language === lang.code && (
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-50">
                <Button
                  onClick={() => speakText(t('welcome'))}
                  variant="ghost"
                  className="w-full h-12 text-slate-300 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                >
                  <Volume2 className="w-5 h-5 mr-3" />
                  <span>{t('speakText') || 'Activate Guidance'}</span>
                </Button>
              </div>
           </div>
        </div>


        {/* Feature Pills */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Smartphone, label: 'Video Call', color: 'primary' },
            { icon: Shield, label: 'Secured', color: 'secondary' },
            { icon: Clock, label: '24/7 Care', color: 'accent' },
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + (i * 0.05) }}
              className="flex flex-col items-center space-y-3"
            >

              <div className={cn(
                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-white border border-slate-100 text-primary shadow-lg shadow-slate-100 hover:scale-110 transition-transform"
              )}>
                <feature.icon className="w-7 h-7" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{feature.label}</p>

            </motion.div>
          ))}
        </div>

        {/* Auth Actions */}
        <div className="space-y-6 pt-6 text-center">
          <SignedOut>
            <SignUpButton mode="modal">
              <Button
                size="lg"
                onClick={() => setIsAuthenticating(true)}
                className="glowing-button w-full h-20 text-2xl font-black rounded-[2rem] group"
              >
                {isAuthenticating ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </div>
                ) : (
                  <>
                    Login/Register
                    <ChevronRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button
              size="lg"
              className="glowing-button w-full h-20 text-2xl font-black rounded-[2rem]"
              onClick={() => router.push('/onboarding')}
            >
              Resume Session →
            </Button>
          </SignedIn>
          {isAuthenticating && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-black text-primary uppercase tracking-[0.5em] animate-pulse"
            >
              Directing to Secure Gate...
            </motion.p>
          )}
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">
            24/7 AI Healthcare Active
          </p>

        </div>

        <div className="text-center text-[10px] text-slate-200 font-black pt-12 uppercase tracking-[0.4em]">
          SwasthGuru Health &bull; 2026
        </div>

      </motion.div>
    </div>
  );
}
