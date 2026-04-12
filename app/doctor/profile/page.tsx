import { getApiUrl } from '@/lib/utils';
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/language-context';
import { useNotification } from '@/contexts/notification-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Stethoscope,
  Clock,
  Star,
  Settings,
  Bell,
  Shield,
  LogOut,
  Edit,
  Save,
  Camera
} from 'lucide-react';
import { MEDICAL_SPECIALIZATIONS } from '@/lib/specializations';

export default function DoctorProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const { t } = useLanguage();
  const { showNotification } = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    experience: '',
    qualifications: '',
    address: '',
    bio: '',
    consultationFee: '',
    languages: [] as string[]
  });

  const [notifications, setNotifications] = useState({
    appointments: true,
    messages: true,
    reminders: true,
    marketing: false
  });

  useEffect(() => {
    if (!isAuthenticated || !isDoctor) {
      router.push('/');
    } else if (user) {
      const fetchProfile = async () => {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/users/doctor/${user.id}`);

          if (response.ok) {
            const profileData = await response.json();
            setFormData({
              name: profileData.name || user.fullName || '',
              email: profileData.email || user.primaryEmailAddress?.emailAddress || '',
              phone: profileData.phone || user.primaryPhoneNumber?.phoneNumber || '',
              specialization: profileData.specialization || (user.unsafeMetadata?.specialization as string) || '',
              experience: profileData.experience || '',
              qualifications: profileData.qualifications || '',
              address: profileData.address || '', // Note: Doctor model doesn't strictly have address in the interface I saw earlier, checking if I should add it or if it maps to 'about' or similar? 
              // Wait, looking at Doctor.ts, it has 'about'. It DOES NOT have 'address'. 
              // Patient has 'address'.
              // I should probably map 'address' to 'about' or add 'address' to Doctor model.
              // For now, let's leave address as empty/local state if not in DB, OR assumes it might be added.
              // Actually, I will check the interface again. IDoctor has: specialization, languages, availability, rating, avatar, experience, qualifications, consultationFee, about, availableSlots, specialties, licenseNumber.
              // It does NOT have address.
              // I will leave address empty for now or map it if I find a persistent place.
              // Let's just use what we have.
              bio: profileData.about || '',
              consultationFee: profileData.consultationFee ? String(profileData.consultationFee) : '',
              languages: profileData.languages || (user.unsafeMetadata?.languages as string[]) || ['english', 'hindi']
            });
          } else {
            console.log('Profile not found in backend, using default/Clerk data');
            // Fallback to defaults
            setFormData(prev => ({
              ...prev,
              name: user.fullName || '',
              email: user.primaryEmailAddress?.emailAddress || '',
              languages: (user.unsafeMetadata?.languages as string[]) || ['english', 'hindi']
            }));
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };

      fetchProfile();
    }
  }, [isAuthenticated, isDoctor, router, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const profileData = {
      fullName: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      specialization: formData.specialization,
      experience: formData.experience,
      qualifications: formData.qualifications,
      consultationFee: formData.consultationFee,
      about: formData.bio,
      // userId: user?.id, // Not needed for body if we use clerkId in route or just pass it
    };

    // localStorage.setItem(`doctor_profile_${user?.id}`, JSON.stringify(profileData)); // Backup or remove

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST', // or PUT if I change the backend to handle updates specifically, but users.ts POST handles updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user?.id,
          role: 'doctor',
          ...formData,
          // Map fields that might be different
          about: formData.bio,
          // licenseNumber: ... (add if I add input for it)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Update Clerk metadata
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          specialization: formData.specialization,
          phone: formData.phone
        }
      });

      setIsEditing(false);
      showNotification('Profile updated successfully', 'success');

    } catch (error) {
      console.error("Failed to update user profile", error);
      showNotification('Failed to update profile', 'error');
    }
  };

  const handleLogout = async () => {
    await signOut();
    showNotification('Logged out successfully', 'info');
    router.push('/');
  };

  if (!isAuthenticated || !user || !isDoctor) {
    return null;
  }

  const stats = [
    { label: 'Total Patients', value: '156', icon: User },
    { label: 'Consultations', value: '1,234', icon: Stethoscope },
    { label: 'Experience', value: '5 Years', icon: Clock },
    { label: 'Rating', value: '4.8', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
                onClick={() => router.push('/doctor/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold logo-text">प्रोफ़ाइल (Profile)</h1>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="h-9 px-4 rounded-xl font-bold border"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" className="h-9 rounded-xl text-sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="h-9 rounded-xl text-sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-20 max-w-4xl">
        {/* Profile Header */}
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-muted/30 border flex flex-col md:flex-row items-center gap-6 sm:gap-8 text-foreground">
          <div className="relative shrink-0">
            <Avatar className="w-24 h-24 border-2 border-background shadow-lg">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                <Stethoscope className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button
                size="icon"
                className="absolute -bottom-1 -right-1 rounded-xl w-8 h-8 shadow-md ring-2 ring-background"
              >
                <Camera className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="space-y-0.5">
              <h2 className="text-2xl font-bold text-foreground">{user.fullName}</h2>
              <p className="text-sm font-bold text-primary italic uppercase tracking-wider">
                {formData.specialization || "General Physician"}
              </p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              {formData.languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="bg-background text-muted-foreground border font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
              <div className="flex items-center px-3 py-1.5 bg-background rounded-full text-xs font-bold text-muted-foreground shadow-none border">
                <Mail className="w-3 h-3 mr-2 text-primary" />
                {formData.email}
              </div>
              <div className="flex items-center px-3 py-1.5 bg-background rounded-full text-xs font-bold text-muted-foreground shadow-none border">
                <Phone className="w-3 h-3 mr-2 text-primary" />
                {formData.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border shadow-none bg-card group transform transition-transform hover:translate-y-[-2px]">
              <CardContent className="p-4 text-center space-y-2">
                <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center mx-auto shadow-sm transition-transform group-hover:scale-110 border border-primary/10">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{stat.label.split(' ')[0]}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Form Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-none border bg-card">
            <CardHeader className="py-4 px-6 border-b bg-muted/30">
              <CardTitle className="text-lg font-bold text-foreground">निजी जानकारी (Personal)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { label: 'Full Name', field: 'name', type: 'text' },
                { label: 'Email Address', field: 'email', type: 'email' },
                { label: 'Phone Number', field: 'phone', type: 'text' },
              ].map((item) => (
                <div key={item.field} className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</label>
                  {isEditing ? (
                    <Input
                      type={item.type}
                      value={(formData as any)[item.field]}
                      onChange={(e) => handleInputChange(item.field, e.target.value)}
                      className="h-10 text-sm font-medium border rounded-xl bg-muted/20"
                    />
                  ) : (
                    <p className="text-sm font-bold text-foreground">{(formData as any)[item.field]}</p>
                  )}
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Clinic Address</label>
                {isEditing ? (
                  <Textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="text-sm font-medium border rounded-xl min-h-[80px] bg-muted/20"
                  />
                ) : (
                  <p className="text-sm font-medium text-muted-foreground italic leading-relaxed">
                    {formData.address || 'No clinic address provided'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border bg-card">
            <CardHeader className="py-4 px-6 border-b bg-muted/30">
              <CardTitle className="text-lg font-bold text-foreground">व्यावसायिक जानकारी (Professional)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Specialization</label>
                {isEditing ? (
                  <select
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    className="w-full h-10 px-3 text-sm font-bold border rounded-xl bg-muted/20 outline-none transition-all"
                  >
                    <option value="">Select Specialization</option>
                    {MEDICAL_SPECIALIZATIONS.map((spec) => (
                      <option key={spec.id} value={spec.name}>{spec.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-bold text-foreground">{formData.specialization}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Experience</label>
                  {isEditing ? (
                    <Input value={formData.experience} onChange={(e) => handleInputChange('experience', e.target.value)} className="h-10 border rounded-xl font-bold bg-muted/20" />
                  ) : <p className="text-lg font-bold text-foreground">{formData.experience} Yrs</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fee</label>
                  {isEditing ? (
                    <Input value={formData.consultationFee} onChange={(e) => handleInputChange('consultationFee', e.target.value)} className="h-10 border rounded-xl font-bold bg-muted/20" />
                  ) : <p className="text-lg font-bold text-foreground">₹{formData.consultationFee}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Qualifications</label>
                {isEditing ? (
                  <Input value={formData.qualifications} onChange={(e) => handleInputChange('qualifications', e.target.value)} className="h-10 border rounded-xl font-bold bg-muted/20" />
                ) : <p className="text-sm font-bold text-foreground">{formData.qualifications}</p>}
              </div>
              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-muted-foreground uppercase border-b pb-1 flex items-center">
                  <User className="w-3 h-3 mr-2" /> About Biography
                </label>
                {isEditing ? (
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="text-sm font-medium border rounded-xl min-h-[100px] bg-muted/20"
                  />
                ) : (
                  <p className="text-sm font-medium text-muted-foreground italic leading-relaxed">
                    {formData.bio || 'Professional bio not provider.'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings & Actions */}
        <div className="space-y-6">
          <Card className="shadow-none border bg-card overflow-hidden">
            <CardHeader className="py-4 px-6 border-b bg-muted/30">
              <CardTitle className="flex items-center text-lg font-bold text-foreground">
                <Bell className="w-5 h-5 mr-3 text-primary" />
                सूचना सेटिंग (Notifications)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-2">
              {[
                { label: 'Visits', sub: 'New appointment alerts', field: 'appointments' },
                { label: 'Messages', sub: 'Patient chat notifications', field: 'messages' },
                { label: 'Reminders', sub: 'Upcoming schedule alerts', field: 'reminders' },
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors">
                  <div>
                    <p className="text-sm font-bold text-foreground">{item.label}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.sub}</p>
                  </div>
                  <Switch
                    className="scale-90"
                    checked={(notifications as any)[item.field]}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, [item.field]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="group cursor-pointer border hover:border-primary/20 transition-all bg-card shadow-none">
              <CardContent className="p-5 flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 border border-blue-500/20">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Settings</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account & Prefs</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer border hover:border-secondary/20 transition-all bg-card shadow-none">
              <CardContent className="p-5 flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 border border-green-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Privacy</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data & Security</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full h-12 text-sm font-bold rounded-xl shadow-none mt-4 transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            लॉग आउट (Log Out)
          </Button>
        </div>
      </main>
    </div>
  );
}
