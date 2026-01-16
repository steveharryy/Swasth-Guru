'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
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
  const { user, isAuthenticated, isDoctor } = useAuth();
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
          fullName: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
          specialization: user.specialization || ''
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Complete Your Profile</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Doctor Profile Information</CardTitle>
            <p className="text-sm text-muted-foreground">
              Please provide your professional details to start consulting patients
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Stethoscope className="w-5 h-5 mr-2" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Dr. John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="doctor@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization *</Label>
                    <select
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Select a specialization</option>
                      {MEDICAL_SPECIALIZATIONS.map((spec) => (
                        <option key={spec.id} value={spec.name}>
                          {spec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your clinic/hospital address"
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-500" />
                  Professional Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience (Years) *</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      placeholder="5"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consultationFee">Consultation Fee (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="consultationFee"
                        type="number"
                        value={formData.consultationFee}
                        onChange={(e) => handleInputChange('consultationFee', e.target.value)}
                        placeholder="500"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualifications">Qualifications *</Label>
                  <Input
                    id="qualifications"
                    value={formData.qualifications}
                    onChange={(e) => handleInputChange('qualifications', e.target.value)}
                    placeholder="MBBS, MD (Internal Medicine)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about">About You</Label>
                  <Textarea
                    id="about"
                    value={formData.about}
                    onChange={(e) => handleInputChange('about', e.target.value)}
                    placeholder="Brief description about your expertise and areas of focus..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Complete Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
