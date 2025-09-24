'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserRound, UserCheck, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserTypeSelectorProps {
  onBack: () => void;
}

export function UserTypeSelector({ onBack }: UserTypeSelectorProps) {
  const { t } = useLanguage();
  const router = useRouter();

  const handleUserTypeSelection = (isDoctor: boolean) => {
    router.push(isDoctor ? '/auth/doctor/login' : '/auth/patient/login');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 gradient-bg">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md mx-auto space-y-8 slide-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold logo-text">SwasthGuru</h1>
          <p className="text-muted-foreground">{t('userType')}</p>
        </div>

        {/* User Type Cards */}
        <Card className="p-6 glass-effect space-y-4">
          <button
            onClick={() => handleUserTypeSelection(false)}
            className="w-full p-4 border-2 border-primary/20 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <UserRound className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-lg">{t('patient')}</h3>
                <p className="text-sm text-muted-foreground">Login with OTP</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleUserTypeSelection(true)}
            className="w-full p-4 border-2 border-secondary/20 rounded-xl hover:border-secondary/40 hover:bg-secondary/5 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <UserCheck className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-lg">{t('doctor')}</h3>
                <p className="text-sm text-muted-foreground">Login with Email</p>
              </div>
            </div>
          </button>
        </Card>

        {/* Back Button */}
        <Button onClick={onBack} variant="ghost" className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>
      </div>
    </div>
  );
}