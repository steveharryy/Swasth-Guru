'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/hooks/use-auth';
import { useNotification } from '@/contexts/notification-context';
import { ArrowLeft, Phone, Lock, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function PatientLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [phone, setPhone] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && phone.length >= 10) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setShowOTP(true);
        setIsLoading(false);
        showNotification('OTP sent successfully!', 'success');
      }, 1500);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp && otp.length === 6) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const userData = {
          id: 'patient-123',
          name: 'Rahul Singh',
          phone: phone,
          isDoctor: false,
          avatar: '/avatars/patient-1.jpg',
        };
        login(userData);
        setIsLoading(false);
        showNotification('Login successful!', 'success');
        router.push('/patient/dashboard');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 gradient-bg">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md mx-auto space-y-6 fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold logo-text">SwasthGuru</h1>
          <p className="text-muted-foreground">{t('patient')} {t('login')}</p>
        </div>

        {/* Login Form */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-center">
              {showOTP ? t('verifyOTP') : t('sendOTP')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showOTP ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('phoneNumber')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Enter your 10-digit phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {t('otpInfo')}
                </p>
                
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={!phone || phone.length < 10 || isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('sendOTP')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('enterOTP')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                      className="pl-10 text-center text-lg tracking-widest"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={!otp || otp.length !== 6 || isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('verifyOTP')}
                </Button>
                
                <div className="text-center">
                  <Button 
                    type="button"
                    variant="link"
                    onClick={() => setShowOTP(false)}
                    disabled={isLoading}
                  >
                    Change phone number
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Back Button */}
        <Button 
          onClick={() => router.back()} 
          variant="ghost" 
          className="w-full"
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>
      </div>
    </div>
  );
}