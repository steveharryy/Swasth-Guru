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
  const { t } = useLanguage();
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
      // Fetch profile from backend
      const fetchProfile = async () => {
        try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/users/patient/${user.id}`);
          if (res.ok) {
            const profileData = await res.json();
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

  if (!isAuthenticated || !user || isDoctor) {
    return null;
  }

  const stats = [
    { label: 'Total Appointments', value: statsData.totalAppointments, icon: Calendar },
    { label: 'Medical Records', value: statsData.medicalRecords, icon: FileText },
    { label: 'Health Score', value: statsData.healthScore, icon: Heart },
    { label: 'Last Checkup', value: statsData.lastCheckup, icon: Activity }
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
            <h2 className="text-2xl font-bold text-foreground">नमस्ते, {user.fullName}</h2>
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
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label.split(' ')[0]}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Forms Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-none border bg-card">
            <CardHeader className="py-4 px-6 border-b bg-muted/30">
              <CardTitle className="text-lg font-bold text-foreground">निजी जानकारी (Personal)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { label: 'Full Name', field: 'name', type: 'text' },
                { label: 'Phone Number', field: 'phone', type: 'text' },
                { label: 'Email Address', field: 'email', type: 'email' },
                { label: 'Date of Birth', field: 'dateOfBirth', type: 'date' },
                { label: 'Blood Group', field: 'bloodGroup', type: 'text' },
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
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Address</label>
                {isEditing ? (
                  <Textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="text-sm font-medium border rounded-xl min-h-[80px] focus:border-primary transition-all shadow-none bg-muted/20"
                  />
                ) : (
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                    {formData.address || 'No address provided'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border bg-card">
            <CardHeader className="py-4 px-6 border-b bg-muted/30">
              <CardTitle className="text-lg font-bold text-foreground">चिकित्सा डेटा (Medical)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Height</label>
                  {isEditing ? (
                    <Input value={formData.height} onChange={(e) => handleInputChange('height', e.target.value)} className="h-10 border rounded-xl font-bold bg-muted/20" />
                  ) : <p className="text-lg font-bold text-foreground">{formData.height || '—'}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Weight</label>
                  {isEditing ? (
                    <Input value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} className="h-10 border rounded-xl font-bold bg-muted/20" />
                  ) : <p className="text-lg font-bold text-foreground">{formData.weight || '—'}</p>}
                </div>
              </div>
              {[
                { label: 'Emergency Contact', field: 'emergencyContact', type: 'text' },
                { label: 'Current Allergies', field: 'allergies', type: 'text' },
                { label: 'Current Medications', field: 'currentMedications', type: 'text' },
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
                    <p className="text-sm font-bold text-foreground">{(formData as any)[item.field] || 'None'}</p>
                  )}
                </div>
              ))}
              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-muted-foreground uppercase border-b pb-1 flex items-center">
                  <Activity className="w-3 h-3 mr-2" /> Medical History
                </label>
                {isEditing ? (
                  <Textarea
                    value={formData.medicalHistory}
                    onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                    className="text-sm font-medium border rounded-xl min-h-[100px] bg-muted/20"
                  />
                ) : (
                  <p className="text-sm font-medium text-muted-foreground italic">
                    {formData.medicalHistory || 'No medical history reported.'}
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
                { label: 'Visits', sub: 'Reminders for appointments', field: 'appointments' },
                { label: 'Health Tips', sub: 'Daily advice for you', field: 'healthTips' },
                { label: 'Emergency', sub: 'Critical health alerts', field: 'emergency' },
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
            className="w-full h-12 text-sm font-bold rounded-xl shadow-none mt-4 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4 mr-2" />
            लॉग आउट (Log Out)
          </Button>
        </div>
      </main>
    </div>
  );
}
