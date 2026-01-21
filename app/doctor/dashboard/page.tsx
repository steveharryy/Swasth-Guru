'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
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
  Phone
} from 'lucide-react';

interface DoctorProfile {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  specialization: string;
  experience: string;
  qualifications: string;
  consultationFee: string;
  about: string;
  completedAt: string;
  userId: string;
  rating: number;
  totalPatients: number;
  totalConsultations: number;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isDoctor } = useAuth();
  const { t } = useLanguage();
  const [profileData, setProfileData] = useState<DoctorProfile | null>(null);

  useEffect(() => {
  if (!user) return; // ⛔ wait for auth to hydrate

  if (!isAuthenticated || !isDoctor) {
    router.push('/');
    return;
  }

  const storedProfile = localStorage.getItem(`doctor_profile_${user.id}`);
  if (!storedProfile) {
    router.push('/doctor/profile-form');
    return;
  }

  try {
    const profile = JSON.parse(storedProfile);
    setProfileData(profile);
  } catch (err) {
    console.error(err);
  }

  const storedAppointments = JSON.parse(
    localStorage.getItem('appointments') || '[]'
  );
  setTodayAppointments(storedAppointments.slice(0, 3));
}, [user, isAuthenticated, isDoctor, router]);


  const [todayAppointments, setTodayAppointments] = useState([
    {
      id: '1',
      patientName: 'Rahul Singh',
      time: '10:00 AM',
      type: 'Video Consultation',
      status: 'upcoming',
      symptoms: ['Fever', 'Cough'],
      avatar: '/avatars/patient-1.jpg'
    }
  ]);

  if (!isAuthenticated || !user || !isDoctor || !profileData) {
    return null;
  }

  const stats = [
    { label: 'Today\'s Appointments', value: todayAppointments.length.toString(), icon: Calendar, color: 'bg-primary/10 text-primary' },
    { label: 'Total Patients', value: profileData.totalPatients.toString(), icon: Users, color: 'bg-secondary/10 text-secondary' },
    { label: 'Total Consultations', value: profileData.totalConsultations.toString(), icon: TrendingUp, color: 'bg-accent/10 text-accent' },
    { label: 'Avg Rating', value: profileData.rating.toString(), icon: Activity, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' },
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
                onClick={() => router.push('/doctor/profile')}
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
                <p className="text-sm text-muted-foreground">{user.specialization}</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-2">
  <Button
    onClick={() => router.push('/doctor/appointments')}
    variant="outline"
  >
    <Calendar className="w-4 h-4 mr-2" />
    View Schedule
  </Button>

  <Button
    onClick={() => {
      if (todayAppointments.length > 0) {
        router.push(`/doctor/consultation/${todayAppointments[0].id}`);
      }
    }}
  >
    <Video className="w-4 h-4 mr-2" />
    Start Consultation
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

        {/* Professional Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="w-5 h-5 mr-2" />
              Professional Profile
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
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{profileData.email}</p>
                    </div>
                  </div>
                  {profileData.address && (
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">{profileData.address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground">Professional Details</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Specialization</p>
                      <p className="font-medium">{profileData.specialization}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Experience</p>
                      <p className="font-medium">{profileData.experience} years</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Qualifications</p>
                    <p className="font-medium">{profileData.qualifications}</p>
                  </div>
                  {profileData.consultationFee && (
                    <div>
                      <p className="text-xs text-muted-foreground">Consultation Fee</p>
                      <p className="font-medium">₹{profileData.consultationFee}</p>
                    </div>
                  )}
                  {profileData.about && (
                    <div>
                      <p className="text-xs text-muted-foreground">About</p>
                      <p className="font-medium text-sm">{profileData.about}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Appointments</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/doctor/appointments')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={appointment.avatar} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{appointment.patientName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.type || 'Video Consultation'}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.time} • {appointment.symptoms?.join(', ') || 'General consultation'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={appointment.status === 'completed' ? 'secondary' : 'default'}
                  >
                    {appointment.status}
                  </Badge>
                  {appointment.status === 'upcoming' && (
                    <Button
                      size="sm"
                      onClick={() => router.push(`/doctor/consultation/${appointment.id}`)}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  )}
                  {appointment.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/doctor/patients/${appointment.id}`)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {todayAppointments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No appointments scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/doctor/patients')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Patient Records</h3>
              <p className="text-sm text-muted-foreground">View and manage patient history</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/doctor/schedule')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Manage Schedule</h3>
              <p className="text-sm text-muted-foreground">Set availability and time slots</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Reports & Analytics</h3>
              <p className="text-sm text-muted-foreground">View practice insights</p>
            </CardContent>
          </Card>
        </div>
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
              <span className="text-xs mt-1">Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center py-2 px-3"
              onClick={() => router.push('/doctor/appointments')}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-xs mt-1">Appointments</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center py-2 px-3"
              onClick={() => router.push('/doctor/patients')}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs mt-1">Patients</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center py-2 px-3"
              onClick={() => router.push('/doctor/profile')}
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