'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { useNotification } from '@/contexts/notification-context';
import { ArrowLeft, Mail, Lock, Loader2, UserRound, Stethoscope, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UnifiedAuthPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showNotification } = useNotification();

  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('selected_role') as 'patient' | 'doctor' | null;
    if (!role) {
      router.push('/auth/role-select');
      return;
    }
    setSelectedRole(role);
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setTimeout(() => {
      const isDoctor = selectedRole === 'doctor';
      const userData = {
        id: isDoctor ? 'doctor-123' : 'patient-123',
        name: isDoctor ? 'Dr. Priya Sharma' : 'Rahul Singh',
        email: email,
        isDoctor: isDoctor,
        specialization: isDoctor ? 'General Physician' : undefined,
        languages: ['english', 'hindi'],
        avatar: isDoctor ? '/avatars/doctor-1.jpg' : '/avatars/patient-1.jpg',
      };
      login(userData);
      setIsLoading(false);
      showNotification('Login successful!', 'success');
      router.push(isDoctor ? '/doctor/dashboard' : '/patient/dashboard');
    }, 1500);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;

    setIsLoading(true);
    setTimeout(() => {
      const isDoctor = selectedRole === 'doctor';
      const userData = {
        id: isDoctor ? `doctor-${Date.now()}` : `patient-${Date.now()}`,
        name: name,
        email: email,
        isDoctor: isDoctor,
        specialization: isDoctor ? 'General Physician' : undefined,
        languages: ['english', 'hindi'],
        avatar: isDoctor ? '/avatars/doctor-1.jpg' : '/avatars/patient-1.jpg',
      };
      login(userData);
      setIsLoading(false);
      showNotification('Account created successfully!', 'success');
      router.push(isDoctor ? '/doctor/dashboard' : '/patient/dashboard');
    }, 1500);
  };

  if (!selectedRole) {
    return null;
  }

  const roleConfig = {
    patient: {
      icon: UserRound,
      color: 'primary',
      title: 'Patient',
      description: 'Access your health records and appointments'
    },
    doctor: {
      icon: Stethoscope,
      color: 'secondary',
      title: 'Doctor',
      description: 'Manage patients and consultations'
    }
  };

  const config = roleConfig[selectedRole];
  const RoleIcon = config.icon;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 gradient-bg">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold logo-text">SwasthGuru</h1>
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-${config.color}/10`}>
            <RoleIcon className={`w-5 h-5 text-${config.color}`} />
            <span className="font-medium">{config.title}</span>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        <Card className="glass-effect">
          <CardHeader>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
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
                    <label className="text-sm font-medium">Password</label>
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
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
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
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!email || !password || !name || isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <div className="text-center">
          <Button
            onClick={() => {
              localStorage.removeItem('selected_role');
              router.push('/auth/role-select');
            }}
            variant="ghost"
            className="w-full"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Change Role
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
