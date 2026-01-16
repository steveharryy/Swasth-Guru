'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
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
  const { user, isAuthenticated, isDoctor, logout, updateUser } = useAuth();
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
      const storedProfile = localStorage.getItem(`doctor_profile_${user.id}`);

      if (storedProfile) {
        try {
          const profileData = JSON.parse(storedProfile);
          setFormData({
            name: profileData.fullName || user.name || '',
            email: profileData.email || user.email || '',
            phone: profileData.phone || user.phone || '',
            specialization: profileData.specialization || user.specialization || '',
            experience: profileData.experience || '',
            qualifications: profileData.qualifications || '',
            address: profileData.address || '',
            bio: profileData.about || '',
            consultationFee: profileData.consultationFee || '',
            languages: user.languages || ['english', 'hindi']
          });
        } catch (error) {
          console.error('Error loading profile:', error);
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            specialization: user.specialization || '',
            experience: '',
            qualifications: '',
            address: '',
            bio: '',
            consultationFee: '',
            languages: user.languages || ['english', 'hindi']
          });
        }
      } else {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          specialization: user.specialization || '',
          experience: '',
          qualifications: '',
          address: '',
          bio: '',
          consultationFee: '',
          languages: user.languages || ['english', 'hindi']
        });
      }
    }
  }, [isAuthenticated, isDoctor, router, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
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
      completedAt: new Date().toISOString(),
      userId: user?.id,
      rating: 4.5,
      totalPatients: 0,
      totalConsultations: 0
    };

    localStorage.setItem(`doctor_profile_${user?.id}`, JSON.stringify(profileData));

    updateUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      specialization: formData.specialization,
      languages: formData.languages
    });
    setIsEditing(false);
    showNotification('Profile updated successfully', 'success');
  };

  const handleLogout = () => {
    logout();
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/doctor/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">{t('profile')}</h1>
            </div>
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    <Stethoscope className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
                <p className="text-muted-foreground mb-2">{user.specialization}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {user.languages?.map((lang) => (
                    <Badge key={lang} variant="secondary">
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {user.email}
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {user.phone}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.name}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.email}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.phone}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                {isEditing ? (
                  <Textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.address}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Specialization</label>
                {isEditing ? (
                  <select
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Select a specialization</option>
                    {MEDICAL_SPECIALIZATIONS.map((spec) => (
                      <option key={spec.id} value={spec.name}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-sm">{formData.specialization}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Experience</label>
                {isEditing ? (
                  <Input
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.experience}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Qualifications</label>
                {isEditing ? (
                  <Input
                    value={formData.qualifications}
                    onChange={(e) => handleInputChange('qualifications', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.qualifications}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Consultation Fee (₹)</label>
                {isEditing ? (
                  <Input
                    value={formData.consultationFee}
                    onChange={(e) => handleInputChange('consultationFee', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">₹{formData.consultationFee}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bio */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About Me</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                placeholder="Write a brief description about yourself..."
              />
            ) : (
              <p className="text-sm">{formData.bio}</p>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Appointment Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified about new appointments</p>
              </div>
              <Switch
                checked={notifications.appointments}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, appointments: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Message Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified about patient messages</p>
              </div>
              <Switch
                checked={notifications.messages}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, messages: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reminder Notifications</p>
                <p className="text-sm text-muted-foreground">Get reminders about upcoming appointments</p>
              </div>
              <Switch
                checked={notifications.reminders}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, reminders: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates about new features</p>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, marketing: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Account Settings</p>
                  <p className="text-sm text-muted-foreground">Manage your account preferences</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Privacy & Security</p>
                  <p className="text-sm text-muted-foreground">Manage your privacy settings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('logout')}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}