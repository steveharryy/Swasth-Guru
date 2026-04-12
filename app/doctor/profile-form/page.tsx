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
import { Stethoscope, Award, IndianRupee, Upload, Loader2, CheckCircle, FileText } from 'lucide-react';
import { MEDICAL_SPECIALIZATIONS } from '@/lib/specializations';
import { cn , getApiUrl } from '@/lib/utils';

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
    about: '',
    licenseNumber: '',
    proofUrl: ''
  });

  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

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
    let finalValue = value;
    const numericFields = ['experience', 'consultationFee'];

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

    if (!formData.fullName || !formData.phone || !formData.specialization || !formData.experience || !formData.licenseNumber) {
      showNotification('Please fill in all required fields, including License Number', 'error');
      return;
    }

    if (!formData.proofUrl) {
      showNotification('Please upload a proof of your medical license', 'error');
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

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user?.id,
          role: 'doctor',
          name: formData.fullName,
          ...formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile to backend');
      }

      localStorage.setItem(`doctor_profile_${user?.id}`, JSON.stringify(profileData));
      showNotification('Profile completed successfully!', 'success');

      setTimeout(() => {
        router.push('/doctor/dashboard');
      }, 500);

    } catch (error) {
      console.error("Failed to update doctor profile", error);
      showNotification('Failed to update profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProofUpload = async (file: File) => {
    setUploadingProof(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileBase64 = await base64Promise;
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/doctors/upload-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: user?.id,
          fileName: file.name,
          fileBase64
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, proofUrl: data.url }));
        showNotification('Proof document uploaded successfully!', 'success');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Proof upload error:', error);
      showNotification('Failed to upload proof document', 'error');
    } finally {
      setUploadingProof(false);
    }
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
                    <Label htmlFor="fullName" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 font-bold">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Dr. John Doe"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20 text-black font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 font-bold">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="doctor@example.com"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20 text-black font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 font-bold">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20 text-black font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="specialization" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 font-bold">Specialization *</Label>
                    <select
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      required
                      className="w-full h-10 px-3 py-2 border border-muted-foreground/20 rounded-xl bg-muted/20 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="" className="text-black">Select specialization</option>
                      {MEDICAL_SPECIALIZATIONS.map((spec) => (
                        <option key={spec.id} value={spec.name} className="text-black">
                          {spec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 font-bold">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your clinic/hospital address"
                    className="rounded-xl bg-muted/20 border-muted-foreground/20 text-black font-medium min-h-[80px]"
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
                    <Label htmlFor="experience" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 font-bold">Experience (Years) *</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        onKeyDown={preventNegative}
                        value={formData.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        placeholder="5"
                        className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20 text-black font-medium"
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
                        min="0"
                        onKeyDown={preventNegative}
                        value={formData.consultationFee}
                        onChange={(e) => handleInputChange('consultationFee', e.target.value)}
                        placeholder="500"
                        className="pl-10 h-10 rounded-xl bg-muted/20 border-muted-foreground/20 text-black font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="qualifications" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Qualifications *</Label>
                    <Input
                      id="qualifications"
                      value={formData.qualifications}
                      onChange={(e) => handleInputChange('qualifications', e.target.value)}
                      placeholder="MBBS, MD (Internal Medicine)"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20 text-black placeholder:text-muted-foreground/50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="licenseNumber" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Medical License Number *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      placeholder="MC-12345-6789"
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20 text-black placeholder:text-muted-foreground/50 font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Verification Document (Photo of Degree/License) *</Label>
                  <div 
                    className={cn(
                      "relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer",
                      formData.proofUrl ? "border-green-500 bg-green-50/50" : "border-muted-foreground/20 bg-muted/5 hover:border-primary/40"
                    )}
                    onClick={() => document.getElementById('proof-upload')?.click()}
                  >
                    <input
                      id="proof-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProofFile(file);
                          handleProofUpload(file);
                        }
                      }}
                    />
                    {uploadingProof ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-sm font-bold text-black">Uploading your document...</p>
                      </div>
                    ) : formData.proofUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-green-700">Document Uploaded Successfully!</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold truncate max-w-[200px]">{proofFile?.name}</p>
                        <Button variant="link" className="text-primary text-[10px] font-bold h-auto p-0 underline" onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, proofUrl: '' })); }}>Replace Document</Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="bg-primary/10 text-primary p-3 rounded-full">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-black">Click here to upload your doctor proof</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold font-mono">JPG, PNG, PDF (MAX 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="about" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">About You</Label>
                  <Textarea
                    id="about"
                    value={formData.about}
                    onChange={(e) => handleInputChange('about', e.target.value)}
                    placeholder="Brief description about your expertise..."
                    className="rounded-xl bg-muted/20 border-muted-foreground/20 text-black font-medium min-h-[100px]"
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
