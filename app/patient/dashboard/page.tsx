'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { MedicineTracker } from '@/components/medicine-tracker';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Users, 
  Clock, 
  Video, 
  FileText, 
  User,
  Home,
  CalendarDays,
  Stethoscope,
  Settings,
  Bell,
  TrendingUp,
  Activity,
  Phone,
  Plus,
  Heart,
  AlertCircle,
  Pill
} from 'lucide-react';
interface Appointment {
  id: string;
  patientId: string;  // 🔹 Add this
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  type: 'video' | 'phone';
  status: 'upcoming' | 'completed' | 'cancelled' | 'confirmed';
  symptoms?: string[];
  avatar?: string;
  consultationFee?: number;
}


interface PatientProfile {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  bloodGroup: string;
  height: string;
  weight: string;
  emergencyContact: string;
  allergies: string;
  currentMedications: string;
  completedAt: string;
  userId: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isDoctor } = useAuth();
  const { t } = useLanguage();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [profileData, setProfileData] = useState<PatientProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated || isDoctor) {
      router.push('/');
    } else {
      // Check if profile is completed
      const storedProfile = localStorage.getItem(`patient_profile_${user?.id}`);
      if (!storedProfile) {
        router.push('/patient/profile-form');
        return;
      }

      try {
        const profile = JSON.parse(storedProfile);
        setProfileData(profile);
      } catch (error) {
        console.error('Error loading profile:', error);
      }

      // Load appointments from localStorage
      const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const userAppointments = storedAppointments.filter((apt: Appointment) =>
        apt.patientId === user?.id &&
        (apt.status === 'upcoming' || apt.status === 'confirmed')
      );
      setUpcomingAppointments(userAppointments.slice(0, 3)); // Show first 3
    }
  }, [isAuthenticated, isDoctor, router, user]);

  if (!isAuthenticated || !user || isDoctor) {
    return null;
  }

  const stats = [
    { label: 'Upcoming Appointments', value: upcomingAppointments.length.toString(), icon: Calendar, color: 'bg-primary/10 text-primary' },
    { label: 'Total Consultations', value: '12', icon: Video, color: 'bg-secondary/10 text-secondary' },
    { label: 'Medical Records', value: '8', icon: FileText, color: 'bg-accent/10 text-accent' },
    { label: 'Health Score', value: '85%', icon: Heart, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' },
  ];

  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold logo-text">SwasthGuru</h1>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/patient/profile')}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Welcome Section */}
        <Card className="mb-6 gradient-bg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">Welcome back, {user.name}</h2>
                <p className="text-muted-foreground">{formattedDate}</p>
                <p className="text-sm text-muted-foreground">How are you feeling today?</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-2">
                <Button 
                  onClick={() => router.push('/patient/appointments/book')}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
                <Button 
                  onClick={() => router.push('/patient/appointments')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  My Appointments
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Information */}
        {profileData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="font-medium">{profileData.fullName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{profileData.phone}</p>
                      </div>
                      {profileData.email && (
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium">{profileData.email}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">{new Date(profileData.dateOfBirth).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="font-medium capitalize">{profileData.gender}</p>
                      </div>
                    </div>
                    {profileData.address && (
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="font-medium">{profileData.address}</p>
                      </div>
                    )}
                    {profileData.emergencyContact && (
                      <div>
                        <p className="text-xs text-muted-foreground">Emergency Contact</p>
                        <p className="font-medium">{profileData.emergencyContact}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground">Medical Information</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      {profileData.bloodGroup && (
                        <div>
                          <p className="text-xs text-muted-foreground">Blood Group</p>
                          <p className="font-medium">{profileData.bloodGroup}</p>
                        </div>
                      )}
                      {profileData.height && (
                        <div>
                          <p className="text-xs text-muted-foreground">Height</p>
                          <p className="font-medium">{profileData.height} cm</p>
                        </div>
                      )}
                      {profileData.weight && (
                        <div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="font-medium">{profileData.weight} kg</p>
                        </div>
                      )}
                    </div>
                    {profileData.allergies && (
                      <div>
                        <p className="text-xs text-muted-foreground">Allergies</p>
                        <p className="font-medium">{profileData.allergies}</p>
                      </div>
                    )}
                    {profileData.currentMedications && (
                      <div>
                        <p className="text-xs text-muted-foreground">Current Medications</p>
                        <p className="font-medium">{profileData.currentMedications}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Appointments */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/patient/appointments')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={appointment.avatar} />
                    <AvatarFallback>
                      <Stethoscope className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{appointment.doctorName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.doctorSpecialization}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.date).toLocaleDateString()} • {appointment.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
                  >
                    {appointment.status}
                  </Badge>
                  <Button 
                    size="sm" 
                    onClick={() => router.push(`/patient/consultation/${appointment.id}`)}
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Join
                  </Button>
                </div>
              </div>
            ))}
            {upcomingAppointments.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                <Button onClick={() => router.push('/patient/appointments/book')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Book Your First Appointment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Tips */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              Health Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">💧 Stay Hydrated</p>
              <p className="text-xs text-green-600 dark:text-green-300">Drink at least 8 glasses of water daily</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">🚶‍♂️ Daily Exercise</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">30 minutes of walking can improve your health</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">😴 Quality Sleep</p>
              <p className="text-xs text-purple-600 dark:text-purple-300">Aim for 7-8 hours of sleep each night</p>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="mb-6 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-200">Emergency</h3>
                <p className="text-sm text-red-600 dark:text-red-300">24/7 emergency medical assistance</p>
              </div>
              <Button variant="destructive">
                <Phone className="w-4 h-4 mr-2" />
                Call 102
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/patient/records')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Medical Records</h3>
              <p className="text-sm text-muted-foreground">View your medical history and reports</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/patient/appointments/book')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Find Doctor</h3>
              <p className="text-sm text-muted-foreground">Book consultation with specialists</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/patient/profile')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">My Profile</h3>
              <p className="text-sm text-muted-foreground">Update your personal information</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/patient/medicine-tracker')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 rounded-full flex items-center justify-center mx-auto mb-3">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Medicine Tracker</h3>
              <p className="text-sm text-muted-foreground">Find medicines in nearby pharmacies</p>
            </CardContent>
          </Card>
        </div>

        {/* Medicine Tracker Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Pill className="w-5 h-5 mr-2" />
              Medicine Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MedicineTracker />
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            <Button 
              variant="ghost" 
              className="flex flex-col items-center py-2 px-3 text-primary"
            >
              <Home className="w-5 h-5" />
              <span className="text-xs mt-1">Home</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center py-2 px-3"
              onClick={() => router.push('/patient/appointments')}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-xs mt-1">Appointments</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center py-2 px-3"
              onClick={() => router.push('/patient/records')}
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs mt-1">Records</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center py-2 px-3"
              onClick={() => router.push('/patient/profile')}
            >
              <User className="w-5 h-5" />
              <span className="text-xs mt-1">Profile</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}