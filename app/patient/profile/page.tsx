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
  const { user, isAuthenticated, isDoctor, logout, updateUser } = useAuth();
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

  useEffect(() => {
    if (!isAuthenticated || isDoctor) {
      router.push('/');
    } else if (user) {
      const storedProfile = localStorage.getItem(`patient_profile_${user.id}`);

      if (storedProfile) {
        try {
          const profileData = JSON.parse(storedProfile);
          setFormData({
            name: profileData.fullName || user.name || '',
            phone: profileData.phone || user.phone || '',
            email: profileData.email || user.email || '',
            address: profileData.address || '',
            dateOfBirth: profileData.dateOfBirth || '',
            gender: profileData.gender || '',
            bloodGroup: profileData.bloodGroup || '',
            height: profileData.height || '',
            weight: profileData.weight || '',
            emergencyContact: profileData.emergencyContact || '',
            medicalHistory: '',
            allergies: profileData.allergies || '',
            currentMedications: profileData.currentMedications || ''
          });
        } catch (error) {
          console.error('Error loading profile:', error);
          setFormData({
            name: user.name || '',
            phone: user.phone || '',
            email: user.email || '',
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
        }
      } else {
        setFormData({
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
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
      }
    }
  }, [isAuthenticated, isDoctor, router, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const profileData = {
      fullName: formData.name,
      phone: formData.phone,
      email: formData.email,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      address: formData.address,
      bloodGroup: formData.bloodGroup,
      height: formData.height,
      weight: formData.weight,
      emergencyContact: formData.emergencyContact,
      allergies: formData.allergies,
      currentMedications: formData.currentMedications,
      completedAt: new Date().toISOString(),
      userId: user?.id
    };

    localStorage.setItem(`patient_profile_${user?.id}`, JSON.stringify(profileData));

    updateUser({
      name: formData.name,
      phone: formData.phone,
      email: formData.email
    });
    setIsEditing(false);
    showNotification('Profile updated successfully', 'success');
  };

  const handleLogout = () => {
    logout();
    showNotification('Logged out successfully', 'info');
    router.push('/');
  };

  if (!isAuthenticated || !user || isDoctor) {
    return null;
  }

  const stats = [
    { label: 'Total Appointments', value: '12', icon: Calendar },
    { label: 'Medical Records', value: '8', icon: FileText },
    { label: 'Health Score', value: '85%', icon: Heart },
    { label: 'Last Checkup', value: '2 weeks ago', icon: Activity }
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
                onClick={() => router.push('/patient/dashboard')}
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
                    <User className="w-12 h-12" />
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
                <p className="text-muted-foreground mb-2">Patient ID: {user.id}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {user.phone}
                  </div>
                  {formData.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {formData.email}
                    </div>
                  )}
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

        {/* Personal Information */}
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
                <label className="text-sm font-medium">Phone Number</label>
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
                <label className="text-sm font-medium">Email</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.email || 'Not provided'}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{new Date(formData.dateOfBirth).toLocaleDateString()}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Gender</label>
                {isEditing ? (
                  <Input
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.gender}</p>
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
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Blood Group</label>
                {isEditing ? (
                  <Input
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.bloodGroup}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Height</label>
                  {isEditing ? (
                    <Input
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm">{formData.height}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Weight</label>
                  {isEditing ? (
                    <Input
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm">{formData.weight}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Emergency Contact</label>
                {isEditing ? (
                  <Input
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.emergencyContact}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Allergies</label>
                {isEditing ? (
                  <Textarea
                    value={formData.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.allergies}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Current Medications</label>
                {isEditing ? (
                  <Textarea
                    value={formData.currentMedications}
                    onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                ) : (
                  <p className="mt-1 text-sm">{formData.currentMedications}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical History */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={formData.medicalHistory}
                onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                rows={4}
                placeholder="Describe any significant medical history..."
              />
            ) : (
              <p className="text-sm">{formData.medicalHistory}</p>
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
                <p className="font-medium">Appointment Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified about upcoming appointments</p>
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
                <p className="font-medium">Health Tips</p>
                <p className="text-sm text-muted-foreground">Receive daily health tips and advice</p>
              </div>
              <Switch
                checked={notifications.healthTips}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, healthTips: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Emergency Alerts</p>
                <p className="text-sm text-muted-foreground">Important health alerts and updates</p>
              </div>
              <Switch
                checked={notifications.emergency}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, emergency: checked }))
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