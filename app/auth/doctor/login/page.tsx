'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/hooks/use-auth';
import { useNotification } from '@/contexts/notification-context';
import { ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DoctorLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const userData = {
          id: 'doctor-123',
          name: 'Dr. Priya Sharma',
          email: email,
          isDoctor: true,
          specialization: 'General Physician',
          languages: ['english', 'hindi'],
          avatar: '/avatars/doctor-1.jpg',
        };
        login(userData);
        setIsLoading(false);
        showNotification('Login successful!', 'success');
        router.push('/doctor/dashboard');
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
          <p className="text-muted-foreground">{t('doctor')} {t('login')}</p>
        </div>

        {/* Login Form */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-center">{t('login')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="button"
                  variant="link"
                  className="text-sm p-0 h-auto"
                  disabled={isLoading}
                >
                  Forgot Password?
                </Button>
              </div>
              
              <Button 
                type="submit"
                className="w-full"
                disabled={!email || !password || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('login')}
              </Button>
            </form>
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