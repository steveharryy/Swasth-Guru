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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/theme-toggle';
import { User, Heart, AlertCircle } from 'lucide-react';

export default function PatientProfileForm() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    bloodGroup: '',
    height: '',
    weight: '',
    emergencyContact: '',
    allergies: '',
    currentMedications: ''
  });

  useEffect(() => {
    if (!isAuthenticated || isDoctor) {
      router.push('/');
    } else {
      // Fetch from API
      const fetchProfile = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
          const response = await fetch(`${apiUrl}/users/patient/${user?.id}`);

          if (response.ok) {
            const profileData = await response.json();
            setFormData({
              fullName: profileData.name || user?.fullName || '',
              phone: profileData.phone || user?.primaryPhoneNumber?.phoneNumber || '',
              email: profileData.email || user?.primaryEmailAddress?.emailAddress || '',
              dateOfBirth: profileData.date_of_birth || '',
              gender: profileData.gender || '',
              address: profileData.address || '',
              bloodGroup: profileData.blood_group || '',
              height: profileData.height || '',
              weight: profileData.weight || '',
              emergencyContact: profileData.emergency_contact || '',
              allergies: profileData.allergies || '',
              currentMedications: profileData.current_medications || ''
            });
          } else if (user) {
            // Fallback to clerk data
            setFormData(prev => ({
              ...prev,
              fullName: user.fullName || '',
              phone: user.primaryPhoneNumber?.phoneNumber || '',
              email: user.primaryEmailAddress?.emailAddress || ''
            }));
          }
        } catch (error) {
          console.error("Error fetching patient profile", error);
        }
      };
      fetchProfile();
    }
  }, [isAuthenticated, isDoctor, router, user]);

  const handleInputChange = (field: string, value: string) => {
    let finalValue = value;
    const numericFields = ['height', 'weight'];

    if (numericFields.includes(field) && value !== '') {
      if (parseFloat(value) < 0) finalValue = '0';
    }

    setFormData(prev => ({ ...prev, [field]: finalValue }));
  };

  const preventNegative = (e: React.KeyboardEvent) => {
    if (e.key === '-' || e.key === 'e') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.dateOfBirth || !formData.gender) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user?.id,
          role: 'patient',
          name: formData.fullName,
          ...formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      showNotification('Profile updated successfully!', 'success');

      // Optional: Redirect or stay
      // setTimeout(() => {
      //   router.push('/patient/dashboard');
      // }, 500);

    } catch (error) {
      console.error("Failed to update profile", error);
      showNotification('Failed to update profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !user || isDoctor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
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
            <CardTitle className="text-lg">Patient Information</CardTitle>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Please provide your medical details for better care
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
                      placeholder="Enter your full name"
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
                    <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyContact" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      type="tel"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      placeholder="+91 98765 43211"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your full address"
                    className="rounded-xl bg-muted/20 border-muted-foreground/20 min-h-[80px]"
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-red-500 rounded-full" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-red-500">
                    Medical Info
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="bloodGroup" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Blood Group</Label>
                    <Select
                      value={formData.bloodGroup}
                      onValueChange={(value) => handleInputChange('bloodGroup', value)}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="height" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="0"
                      onKeyDown={preventNegative}
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      placeholder="170"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="weight" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      onKeyDown={preventNegative}
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="65"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-orange-500 rounded-full" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-orange-500">
                    Health History
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="allergies" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      placeholder="List any allergies (e.g., Penicillin, Peanuts, None)"
                      className="rounded-xl bg-muted/20 border-muted-foreground/20 min-h-[80px]"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="currentMedications" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Current Medications</Label>
                    <Textarea
                      id="currentMedications"
                      value={formData.currentMedications}
                      onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                      placeholder="List any medications you are currently taking"
                      className="rounded-xl bg-muted/20 border-muted-foreground/20 min-h-[80px]"
                      rows={2}
                    />
                  </div>
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
