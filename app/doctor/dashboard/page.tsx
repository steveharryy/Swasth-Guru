'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAppointmentTimeStatus, cn } from '@/lib/utils';
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
  const { user, isLoaded } = useUser();
  const { t } = useLanguage();
  const [profileData, setProfileData] = useState<DoctorProfile | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    if (user.unsafeMetadata?.role !== 'doctor') {
      router.push('/');
      return;
    }

    // Temporary: In a real app we'd fetch from API
    // For migration, we rely on local storage or Clerk metadata if we synced it
    // Assuming we still want to use the form flow for detailed profile if it's not in metadata

    if (!user.unsafeMetadata?.onboardingComplete) {
      router.push('/onboarding');
      return;
    }

    // Fallback to local storage for demo purposes if metadata isn't fully robust yet
    const loadDoctorData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/users/doctor/${user.id}`);
        if (res.ok) {
          const remoteProfile = await res.json();
          // Map snake_case to camelCase
          const mappedProfile = {
            fullName: remoteProfile.name,
            email: remoteProfile.email,
            phone: remoteProfile.phone,
            address: remoteProfile.address,
            specialization: remoteProfile.specialization,
            experience: remoteProfile.experience,
            qualifications: remoteProfile.qualifications,
            consultationFee: remoteProfile.consultation_fee?.toString(),
            about: remoteProfile.about,
            userId: remoteProfile.clerk_id,
            rating: remoteProfile.rating || 5.0,
            totalPatients: 0,
            totalConsultations: 0,
            completedAt: remoteProfile.updated_at
          };
          setProfileData(mappedProfile as DoctorProfile);
          localStorage.setItem(`doctor_profile_${user.id}`, JSON.stringify(mappedProfile));

          const today = new Date().toISOString().split('T')[0];

          // Fetch appointments from API
          const aptRes = await fetch(`${apiUrl}/appointments/doctor/${user.id}`);
          let doctorAppointments = [];
          if (aptRes.ok) {
            doctorAppointments = await aptRes.json();
            // Map keys
            doctorAppointments = doctorAppointments.map((apt: any) => ({
              ...apt,
              id: apt.id.toString(),
              patientId: apt.patient_id || apt.patientId,
              doctorId: apt.doctor_id || apt.doctorId,
              doctorName: apt.doctor_name || apt.doctorName,
              doctorSpecialization: apt.doctor_specialization || apt.doctorSpecialization,
              patientName: apt.patient?.name || apt.patient_name || apt.patientName || 'Patient',
              status: apt.status?.toLowerCase() || 'pending',
              date: apt.date,
              time: apt.time
            }));

            // Deduplicate by ID
            const uniqueAppointments = doctorAppointments.reduce((acc: any[], current: any) => {
              if (!acc.find(item => item.id === current.id)) {
                return acc.concat([current]);
              }
              return acc;
            }, []);

            setRecentAppointments(uniqueAppointments.slice(0, 5));
            localStorage.setItem('appointments', JSON.stringify(doctorAppointments));
          } else {
            const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            doctorAppointments = storedAppointments.filter((apt: any) =>
              apt.doctorId === user.id || (remoteProfile.id && apt.doctorId?.toString() === remoteProfile.id.toString())
            );
          }

          // Better helper for date comparison
          const normalizeDate = (d: string) => {
            if (!d) return '';
            if (d.includes('T')) return d.split('T')[0];
            if (d.includes('/')) {
              const parts = d.split('/');
              if (parts.length === 3) {
                if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
              }
            }
            return d;
          };

          const activeAppointments = doctorAppointments.filter((apt: any) => apt.status !== 'cancelled');
          const todayApts = activeAppointments.filter((apt: any) => {
            const isToday = normalizeDate(apt.date) === normalizeDate(today);
            const isOver = getAppointmentTimeStatus(apt.date, apt.time) === 'over';
            return isToday && apt.status !== 'completed' && !isOver;
          });
          setTodayAppointments(todayApts);

          const totalPatients = new Set(activeAppointments.map((apt: any) => apt.patientId)).size;
          const totalConsultations = activeAppointments.length;

          setProfileData(prev => prev ? {
            ...prev,
            totalPatients,
            totalConsultations
          } : null);
        } else {
          // Fallback to local storage if API fails
          const storedProfile = localStorage.getItem(`doctor_profile_${user.id}`);
          if (storedProfile) {
            setProfileData(JSON.parse(storedProfile));
          } else {
            // Last resort: Create fallback from Clerk
            setProfileData({
              fullName: user.fullName || '',
              email: user.primaryEmailAddress?.emailAddress || '',
              phone: '',
              address: '',
              specialization: 'General',
              experience: '0',
              qualifications: '',
              consultationFee: '500',
              about: '',
              userId: user.id,
              rating: 5.0,
              totalPatients: 0,
              totalConsultations: 0,
              completedAt: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch doctor data:", err);
        // On network error (backend down), use fallback
        const storedProfile = localStorage.getItem(`doctor_profile_${user.id}`);
        if (storedProfile) {
          setProfileData(JSON.parse(storedProfile));
        } else {
          setProfileData({
            fullName: user.fullName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            phone: '',
            address: '',
            specialization: 'General',
            experience: '0',
            qualifications: '',
            consultationFee: '500',
            about: '',
            userId: user.id,
            rating: 5.0,
            totalPatients: 0,
            totalConsultations: 0,
            completedAt: new Date().toISOString()
          });
        }
      }
    };

    loadDoctorData();
  }, [user, isLoaded, router]);

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setTodayAppointments(prev => prev.map(apt =>
          apt.id === appointmentId ? { ...apt, status: status as any } : apt
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };


  if (!isLoaded || !user || !profileData) {
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
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold logo-text">SwasthGuru</h1>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Bell className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              <div className="h-6 w-[1px] bg-border hidden sm:block"></div>
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-8 w-8' } }} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 pb-28 max-w-5xl">
        {/* Welcome Section */}
        <div className="mb-8 p-6 rounded-2xl bg-primary/5 border flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">नमस्ते, Dr. {user.firstName}</h2>
            <p className="text-lg text-muted-foreground">{formattedDate}</p>
            <div className="inline-flex items-center px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-medium mt-2 border border-blue-500/20">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              {profileData.specialization} • Specialist
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button
              onClick={() => router.push('/doctor/appointments')}
              variant="outline"
              className="h-12 px-8 text-base rounded-2xl border-2 border-primary/40 hover:bg-primary/10 transition-all font-bold text-primary"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule
            </Button>
            <Button
              variant="premium"
              className="h-12 px-8 text-base rounded-2xl font-bold shadow-lg border-2 border-primary/20"
              disabled={!todayAppointments.some(apt => getAppointmentTimeStatus(apt.date, apt.time) === 'ready')}
              onClick={() => {
                const readyApt = todayAppointments.find(apt => getAppointmentTimeStatus(apt.date, apt.time) === 'ready');
                if (readyApt) {
                  router.push(`/doctor/consultation/${readyApt.id}`);
                }
              }}
            >
              <Video className="w-5 h-5 mr-3 text-primary" />
              Join Call
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border shadow-none bg-card">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className={cn("p-3 rounded-xl", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Professional Profile */}
        <Card className="mb-8 border shadow-none">
          <CardHeader className="border-b py-4 px-6">
            <CardTitle className="flex items-center text-lg font-bold text-foreground">
              <Stethoscope className="w-5 h-5 mr-3 text-primary" />
              Professional Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-l-2 border-primary pl-3">Personal Details</h4>
                <div className="grid gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Doctors Name</p>
                    <p className="text-lg font-semibold text-foreground">{profileData.fullName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone</p>
                      <p className="text-sm font-semibold text-foreground">{profileData.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Email</p>
                      <p className="text-sm font-semibold text-foreground truncate">{profileData.email}</p>
                    </div>
                  </div>
                  {profileData.address && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Clinic Address</p>
                      <p className="text-sm font-semibold text-foreground">{profileData.address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-l-2 border-secondary pl-3">Clinical Info</h4>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Spec.</p>
                      <p className="text-base font-bold text-blue-500">{profileData.specialization}</p>
                    </div>
                    <div className="p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Exp.</p>
                      <p className="text-base font-bold text-green-500">{profileData.experience} Years</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Qualifications</p>
                    <p className="text-sm font-semibold text-foreground">{profileData.qualifications}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Fee per Call</p>
                      <p className="text-lg font-bold text-foreground">₹{profileData.consultationFee}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Rating</p>
                      <p className="text-lg font-bold text-orange-500">{profileData.rating.toFixed(1)} ★</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {profileData.about && (
              <div className="mt-6 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">About the Practice</p>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">"{profileData.about}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card className="mb-8 border shadow-none overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-4 bg-primary/5 px-6">
            <CardTitle className="text-lg font-bold">आज की नियुक्तियां (Today's Visits)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="px-4 h-9 text-xs font-bold"
              onClick={() => router.push('/doctor/appointments')}
            >
              Full Schedule
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-2xl bg-card gap-4 hover:border-primary/20 transition-all">
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className="relative shrink-0">
                    <Avatar className="w-16 h-16 border-2">
                      <AvatarImage src={appointment.avatar} />
                      <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                        {appointment.patientName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg border-2 border-background">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-lg font-bold text-foreground">{appointment.patientName}</p>
                    <p className="text-sm font-medium text-primary italic capitalize">"{appointment.symptoms?.join(', ') || 'General Visit'}"</p>
                    <div className="flex items-center text-xs text-muted-foreground font-medium mt-1">
                      <Clock className="w-3.5 h-3.5 mr-2" />
                      {appointment.time}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <Badge variant={(appointment.status === 'completed' || getAppointmentTimeStatus(appointment.date, appointment.time) === 'over') ? 'destructive' : (appointment.status === 'confirmed' ? 'default' : 'secondary')} className={cn(
                    "px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-widest border",
                    (appointment.status === 'completed' || getAppointmentTimeStatus(appointment.date, appointment.time) === 'over') ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400" :
                      appointment.status === 'cancelled' ? "bg-red-100 text-red-700 border-red-200" :
                        "bg-primary/5 text-primary border-primary/10"
                  )}>
                    {(appointment.status === 'completed' || getAppointmentTimeStatus(appointment.date, appointment.time) === 'over') ? 'Completed' : appointment.status.toUpperCase()}
                  </Badge>
                  {(appointment.status === 'upcoming' || appointment.status === 'confirmed') &&
                    getAppointmentTimeStatus(appointment.date, appointment.time) !== 'over' && (
                      <>
                        {getAppointmentTimeStatus(appointment.date, appointment.time) === 'ready' && (
                          <Button
                            variant="premium"
                            className="h-9 px-6 text-sm font-bold rounded-xl flex items-center shadow-md border-2 border-primary/20"
                            onClick={() => router.push(`/doctor/consultation/${appointment.id}`)}
                          >
                            <Video className="w-4 h-4 mr-2 text-primary" />
                            Join Call
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="h-9 px-4 text-xs font-bold rounded-xl border-green-500/30 text-green-500 hover:bg-green-500/10"
                          onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                        >
                          Complete
                        </Button>
                      </>
                    )}
                  {appointment.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="premium"
                      className="h-11 px-6 text-base font-bold"
                      onClick={() => router.push(`/doctor/patients/${appointment.patientId}`)}
                    >
                      <FileText className="w-5 h-5 mr-3 text-primary" />
                      Summary
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {todayAppointments.length === 0 && (
              <div className="text-center py-20 space-y-8">
                <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-14 h-14 text-slate-300" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-extrabold text-slate-800">कोई नियुक्तियां नहीं</p>
                  <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">No Appointments Today</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Patient Files', sub: 'View History', icon: Users, color: 'bg-primary/10 text-primary', path: '/doctor/patients' },
            { label: 'My Schedule', sub: 'Availability', icon: Clock, color: 'bg-secondary/10 text-secondary', path: '/doctor/schedule' },
            { label: 'Practice Data', sub: 'Insights', icon: FileText, color: 'bg-orange-500/10 text-orange-500', path: '/doctor/analytics' },
          ].map((action, i) => (
            <Card key={i} className="group cursor-pointer border shadow-none hover:bg-muted/30 transition-colors" onClick={() => router.push(action.path)}>
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", action.color)}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{action.label}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{action.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t h-16 z-50">
        <div className="container mx-auto px-4 h-full max-w-5xl">
          <div className="flex justify-around items-center h-full">
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full text-primary gap-1 px-2"
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-bold">Home</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1 px-2"
              onClick={() => router.push('/doctor/appointments')}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-[10px] font-bold">Visits</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1 px-2"
              onClick={() => router.push('/doctor/patients')}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-bold">Patients</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1 px-2"
              onClick={() => router.push('/doctor/profile')}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-bold">Me</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}