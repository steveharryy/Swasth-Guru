'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserRound, Stethoscope, ArrowLeft, CheckCircle } from 'lucide-react';

export default function RoleSelectPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);

  const handleRoleSelection = (role: 'patient' | 'doctor') => {
    setSelectedRole(role);
    setTimeout(() => {
      localStorage.setItem('selected_role', role);
      router.push('/auth/login');
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 gradient-bg">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto space-y-8 slide-up">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold logo-text">SwasthGuru</h1>
          <p className="text-muted-foreground">Choose your role to continue</p>
        </div>

        <Card className="p-6 glass-effect space-y-4">
          <button
            onClick={() => handleRoleSelection('patient')}
            className={`w-full p-6 border-2 rounded-xl transition-all duration-200 group relative ${
              selectedRole === 'patient'
                ? 'border-primary bg-primary/10 scale-[1.02]'
                : 'border-primary/20 hover:border-primary/40 hover:bg-primary/5'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                selectedRole === 'patient'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary group-hover:bg-primary/20'
              }`}>
                <UserRound className="w-8 h-8" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-xl mb-1">Patient</h3>
                <p className="text-sm text-muted-foreground">Book appointments and consult doctors</p>
              </div>
              {selectedRole === 'patient' && (
                <CheckCircle className="w-6 h-6 text-primary" />
              )}
            </div>
          </button>

          <button
            onClick={() => handleRoleSelection('doctor')}
            className={`w-full p-6 border-2 rounded-xl transition-all duration-200 group relative ${
              selectedRole === 'doctor'
                ? 'border-secondary bg-secondary/10 scale-[1.02]'
                : 'border-secondary/20 hover:border-secondary/40 hover:bg-secondary/5'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                selectedRole === 'doctor'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-secondary/10 text-secondary group-hover:bg-secondary/20'
              }`}>
                <Stethoscope className="w-8 h-8" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-xl mb-1">Doctor</h3>
                <p className="text-sm text-muted-foreground">Manage patients and consultations</p>
              </div>
              {selectedRole === 'doctor' && (
                <CheckCircle className="w-6 h-6 text-secondary" />
              )}
            </div>
          </button>
        </Card>

        <Button onClick={() => router.push('/')} variant="ghost" className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
