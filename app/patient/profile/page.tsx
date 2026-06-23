'use client';

import { getApiUrl } from '@/lib/utils';

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
  Calendar,
  Heart,
  Settings,
  Bell,
  Shield,
  LogOut,
  Edit,
  Save,
  Camera,
  FileText,
  Activity
} from 'lucide-react';

export default function PatientProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const { language, setLanguage, t } = useLanguage();
  const { showNotification } = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    height: '',
    weight: '',
    emergencyContact: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: ''
  });

  const [notifications, setNotifications] = useState({
    appointments: true,
    reminders: true,
    healthTips: true,
    emergency: true
  });

  const [statsData, setStatsData] = useState({
    totalAppointments: '0',
    medicalRecords: '0',
    healthScore: '100%',
    lastCheckup: 'None'
  });

  useEffect(() => {
    if (!isAuthenticated || isDoctor) {
      router.push('/');
    } else if (user) {
      // Cache-first: load from localStorage immediately
      const cached = localStorage.getItem(`patient_profile_${user.id}`);
      if (cached) {
        try {
          const p = JSON.parse(cached);
          setFormData(prev => ({
            ...prev,
            name: p.fullName || p.name || user.fullName || '',
            phone: p.phone || '',
            email: p.email || user.primaryEmailAddress?.emailAddress || '',
            address: p.address || '',
            dateOfBirth: p.dateOfBirth || p.date_of_birth || '',
            gender: p.gender || '',
            bloodGroup: p.bloodGroup || p.blood_group || '',
            height: p.height || '',
            weight: p.weight || '',
            emergencyContact: p.emergencyContact || p.emergency_contact || '',
            allergies: p.allergies || '',
            currentMedications: p.currentMedications || p.current_medications || ''
          }));
        } catch (_) {}
      }

      // Fetch profile from backend
      const fetchProfile = async () => {
        try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/users/patient/${user.id}`);
          if (res.ok) {
            const profileData = await res.json();
            // Persist to localStorage for next visit
            localStorage.setItem(`patient_profile_${user.id}`, JSON.stringify(profileData));
            setFormData({
              name: profileData.name || user.fullName || '',
              phone: profileData.phone || user.primaryPhoneNumber?.phoneNumber || '',
              email: profileData.email || user.primaryEmailAddress?.emailAddress || '',
              address: profileData.address || '',
              dateOfBirth: profileData.dateOfBirth || '',
              gender: profileData.gender || '',
              bloodGroup: profileData.bloodGroup || '',
              height: profileData.height || '',
              weight: profileData.weight || '',
              emergencyContact: profileData.emergencyContact || '',
              medicalHistory: profileData.medicalHistory || '',
              allergies: profileData.allergies || '',
              currentMedications: profileData.currentMedications || ''
            });
          } else {
            // Fallback if not found (new user)
            setFormData(prev => ({
              ...prev,
              name: user.fullName || '',
              phone: user.primaryPhoneNumber?.phoneNumber || '',
              email: user.primaryEmailAddress?.emailAddress || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };

      fetchProfile();

      // Fetch Stats from localStorage
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const userAppointmentsCount = appointments.filter((a: any) => a.patientId === user.id).length;

      const records = JSON.parse(localStorage.getItem(`medical_records_${user.id}`) || '[]');
      const userRecordsCount = records.length;

      setStatsData({
        totalAppointments: userAppointmentsCount.toString(),
        medicalRecords: userRecordsCount.toString(),
        healthScore: userRecordsCount > 0 ? "90%" : "100%",
        lastCheckup: userAppointmentsCount > 0 ? "Recent" : "None"
      });
    }
  }, [isAuthenticated, isDoctor, router, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const profileData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        bloodGroup: formData.bloodGroup,
        height: formData.height,
        weight: formData.weight,
        emergencyContact: formData.emergencyContact,
        allergies: formData.allergies,
        currentMedications: formData.currentMedications,
        medicalHistory: formData.medicalHistory
      };

      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user?.id,
          role: 'patient',
          ...profileData
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      // Update Clerk metadata if needed
      try {
        user?.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            phone: formData.phone,
          }
        });
      } catch (error) {
        console.error("Failed to update user metadata", error);
      }

      setIsEditing(false);
      showNotification('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Failed to update profile', 'error');
    }
  };

  const handleLogout = async () => {
    await signOut();
    showNotification('Logged out successfully', 'info');
    router.push('/');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b sticky top-0 z-50 h-[57px]" />
        <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
          <div className="h-40 rounded-3xl bg-muted/40 animate-pulse" />
          <div className="h-24 rounded-3xl bg-muted/40 animate-pulse" />
          <div className="h-64 rounded-3xl bg-muted/40 animate-pulse" />
        </main>
      </div>
    );
  }

  if (!isAuthenticated || !user || isDoctor) {
    return null;
  }

  const stats = [
    { label: t('my_appointments'), value: statsData.totalAppointments, icon: Calendar },
    { label: t('stat_records'), value: statsData.medicalRecords, icon: FileText },
    { label: t('stat_score'), value: statsData.healthScore, icon: Heart },
    { label: t('stat_last_checkup'), value: statsData.lastCheckup, icon: Activity }
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
                onClick={() => router.push('/patient/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold logo-text">{t('my_profile_title')}</h1>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="h-9 px-4 rounded-xl font-bold border"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t('edit')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" className="h-9 rounded-xl text-sm" onClick={() => setIsEditing(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleSave} className="h-9 rounded-xl text-sm">
                    <Save className="w-4 h-4 mr-2" />
                    {t('save')}
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
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-muted/30 border flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          <div className="relative shrink-0">
            <Avatar className="w-24 h-24 border-2 border-background shadow-lg">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                <User className="w-12 h-12" />
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
          <div className="flex-1 text-center md:text-left space-y-1">
            <h2 className="text-2xl font-bold text-foreground">{t('namaste')}, {user.fullName}</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient ID: {user.id.slice(-8).toUpperCase()}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
              <div className="flex items-center px-3 py-1.5 bg-background rounded-full text-xs font-bold text-muted-foreground shadow-none border">
                <Phone className="w-3 h-3 mr-2 text-primary" />
                {user.primaryPhoneNumber?.phoneNumber}
              </div>
              {formData.email && (
                <div className="flex items-center px-3 py-1.5 bg-background rounded-full text-xs font-bold text-muted-foreground shadow-none border">
                  <Mail className="w-3 h-3 mr-2 text-primary" />
                  {formData.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border shadow-none bg-card">
              <CardContent className="p-4 text-center space-y-2">
                <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center mx-auto transition-transform hover:scale-110 border border-primary/10">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Forms Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-none border bg-card">
            <CardHeader className="py-4 px-6 border-b bg-muted/30">
              <CardTitle className="text-lg font-bold text-foreground">{t('personal_info')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { label: t('full_name'), field: 'name', type: 'text' },
                { label: t('phone'), field: 'phone', type: 'text' },
                { label: t('email'), field: 'email', type: 'email' },
                { label: t('dob'), field: 'dateOfBirth', type: 'date' },
                { label: t('blood_group'), field: 'bloodGroup', type: 'text' },
              ].map((item) => (
                <div key={item.field} className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</label>
                  {isEditing ? (
                    <Input
                      type={item.type}
                      value={(formData as any)[item.field]}
                      onChange={(e) => handleInputChange(item.field, e.target.value)}
                      className="h-10 text-sm font-medium border rounded-xl focus:border-primary transition-all shadow-none bg-muted/20"
                    />
                  ) : (
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                      {(formData as any)[item.field] || '—'}
                    </p>
                  )}
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('address')}</label>
                {isEditing ? (
                  <Textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="text-sm font-medium border rounded-xl min-h-[80px] focus:border-primary transition-all shadow-none bg-muted/20"
                  />
                ) : (
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                    {formData.address || '—'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border bg-card">
            <CardHeader className="py-4 px-6 border-b bg-muted/30">
              <CardTitle className="text-lg font-bold text-foreground">{t('medical_info')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('height')}</label>
                  {isEditing ? (
                    <Input value={formData.height} onChange={(e) => handleInputChange('height', e.target.value)} className="h-10 border rounded-xl font-bold bg-muted/20" />
                  ) : <p className="text-lg font-bold text-foreground">{formData.height || '—'}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('weight')}</label>
                  {isEditing ? (
                    <Input value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} className="h-10 border rounded-xl font-bold bg-muted/20" />
                  ) : <p className="text-lg font-bold text-foreground">{formData.weight || '—'}</p>}
                </div>
              </div>
              {[
                { label: t('emergency_contact'), field: 'emergencyContact', type: 'text' },
                { label: t('allergies'), field: 'allergies', type: 'text' },
                { label: t('current_medications'), field: 'currentMedications', type: 'text' },
              ].map((item) => (
                <div key={item.field} className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</label>
                  {isEditing ? (
                    <Input
                      value={(formData as any)[item.field]}
                      onChange={(e) => handleInputChange(item.field, e.target.value)}
                      className="h-10 text-sm font-medium border rounded-xl bg-muted/20"
                    />
                  ) : (
                    <p className="text-sm font-bold text-foreground">{(formData as any)[item.field] || '—'}</p>
                  )}
                </div>
              ))}
              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-muted-foreground uppercase border-b pb-1 flex items-center">
                  <Activity className="w-3 h-3 mr-2" /> {t('medical_history')}
                </label>
                {isEditing ? (
                  <Textarea
                    value={formData.medicalHistory}
                    onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                    className="text-sm font-medium border rounded-xl min-h-[100px] bg-muted/20"
                  />
                ) : (
                  <p className="text-sm font-medium text-muted-foreground italic">
                    {formData.medicalHistory || '—'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings & Actions */}
        <div className="space-y-6">
          {/* Language Selection Card */}
          <Card className="shadow-none border bg-card overflow-hidden">
            <CardHeader className="py-4 px-6 border-b bg-muted/30">
              <CardTitle className="flex items-center text-lg font-bold text-foreground">
                🗣️ {t('chooseLanguage')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Button
                  onClick={() => setLanguage('english')}
                  variant={language === 'english' ? 'premium' : 'outline'}
                  className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all ${
                    language === 'english'
                      ? 'shadow-md shadow-primary/20 brightness-110'
                      : 'border-border dark:border-border'
                  }`}
                >
                  🇺🇸 English
                </Button>
                <Button
                  onClick={() => setLanguage('hindi')}
                  variant={language === 'hindi' ? 'premium' : 'outline'}
                  className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all ${
                    language === 'hindi'
                      ? 'shadow-md shadow-primary/20 brightness-110'
                      : 'border-border dark:border-border'
                  }`}
                >
                  🇮🇳 हिन्दी (Hindi)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border bg-card overflow-hidden">
            <CardHeader className="py-4 px-6 border-b bg-muted/30">
              <CardTitle className="flex items-center text-lg font-bold text-foreground">
                <Bell className="w-5 h-5 mr-3 text-primary" />
                {t('notification_settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-2">
              {[
                { label: t('stat_upcoming_short'), sub: t('notification_visits_desc'), field: 'appointments' },
                { label: t('health_tips'), sub: t('notification_tips_desc'), field: 'healthTips' },
                { label: t('emergency'), sub: t('notification_emergency_desc'), field: 'emergency' },
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
                  <p className="text-sm font-bold text-foreground">{t('settings')}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('account_prefs')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer border hover:border-secondary/20 transition-all bg-card shadow-none">
              <CardContent className="p-5 flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 border border-green-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t('privacy')}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('data_security')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full h-12 text-sm font-bold rounded-xl shadow-none mt-4 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('logout')}
          </Button>
        </div>
      </main>
    </div>
  );
}
