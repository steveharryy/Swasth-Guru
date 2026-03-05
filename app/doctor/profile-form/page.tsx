'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useNotification } from '@/contexts/notification-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/theme-toggle';
import { Stethoscope, Award, IndianRupee } from 'lucide-react';
import { MEDICAL_SPECIALIZATIONS } from '@/lib/specializations';

export default function DoctorProfileForm() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    specialization: '',
    experience: '',
    qualifications: '',
    consultationFee: '',
    about: ''
  });

  useEffect(() => {
    if (!isAuthenticated || !isDoctor) {
      router.push('/');
    } else {
      const existingProfile = localStorage.getItem(`doctor_profile_${user?.id}`);
      if (existingProfile) {
        router.push('/doctor/dashboard');
      } else if (user) {
        setFormData(prev => ({
          ...prev,
          fullName: user.fullName || '',
          phone: user.primaryPhoneNumber?.phoneNumber || '',
          email: user.primaryEmailAddress?.emailAddress || '',
          specialization: (user.unsafeMetadata?.specialization as string) || ''
        }));
      }
    }
  }, [isAuthenticated, isDoctor, router, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.specialization || !formData.experience) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    const profileData = {
      ...formData,
      completedAt: new Date().toISOString(),
      userId: user?.id,
      rating: 4.5,
      totalPatients: 0,
      totalConsultations: 0
    };

    localStorage.setItem(`doctor_profile_${user?.id}`, JSON.stringify(profileData));

    showNotification('Profile completed successfully!', 'success');

    setTimeout(() => {
      router.push('/doctor/dashboard');
    }, 500);
  };

  if (!isAuthenticated || !user || !isDoctor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Complete Profile</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20 max-w-2xl">
        <Card className="shadow-none border bg-card">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-lg">Doctor Information</CardTitle>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Professional details for patient consultations
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary">
                    Personal Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Dr. John Doe"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="doctor@example.com"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="specialization" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Specialization *</Label>
                    <select
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      required
                      className="w-full h-10 px-3 py-2 border border-muted-foreground/20 rounded-xl bg-muted/20 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select specialization</option>
                      {MEDICAL_SPECIALIZATIONS.map((spec) => (
                        <option key={spec.id} value={spec.name}>
                          {spec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your clinic/hospital address"
                    className="rounded-xl bg-muted/20 border-muted-foreground/20 min-h-[80px]"
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-yellow-500 rounded-full" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-500">
                    Professional
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="experience" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Experience (Years) *</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      placeholder="5"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="consultationFee" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Consultation Fee (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="consultationFee"
                        type="number"
                        value={formData.consultationFee}
                        onChange={(e) => handleInputChange('consultationFee', e.target.value)}
                        placeholder="500"
                        className="pl-10 h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qualifications" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Qualifications *</Label>
                  <Input
                    id="qualifications"
                    value={formData.qualifications}
                    onChange={(e) => handleInputChange('qualifications', e.target.value)}
                    placeholder="MBBS, MD (Internal Medicine)"
                    className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="about" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">About You</Label>
                  <Textarea
                    id="about"
                    value={formData.about}
                    onChange={(e) => handleInputChange('about', e.target.value)}
                    placeholder="Brief description about your expertise..."
                    className="rounded-xl bg-muted/20 border-muted-foreground/20 min-h-[100px]"
                    rows={4}
                  />
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'SAVING...' : 'COMPLETE PROFILE'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
