'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);


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

    // Cache-First: Load from localStorage immediately for instant UI
    const localProfile = localStorage.getItem(`doctor_profile_${user.id}`);
    const localApts = localStorage.getItem('appointments');
    
    if (localProfile) {
      setProfileData(JSON.parse(localProfile));
    }
    
    if (localApts) {
       const storedAppointments = JSON.parse(localApts).filter((apt: any) =>
          apt.doctorId === user.id && apt.status !== 'pending_payment'
        );
        const today = new Date().toISOString().split('T')[0];
        const activeAppointments = storedAppointments.filter((apt: any) => apt.status !== 'cancelled');
        const todayApts = activeAppointments.filter((apt: any) => {
          if (apt.date === 'hackathon') return true;
          return apt.date === today && apt.status !== 'completed';
        });

        setRecentAppointments(storedAppointments.slice(0, 5));
        setTodayAppointments(todayApts);
    }

    // Fallback to local storage for demo purposes if metadata isn't fully robust yet
    const loadDoctorData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
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

          // Fetch appointments from API and Local Storage (for Hackathon Demo)
          const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
          const hackathonApts = storedAppointments.filter((apt: any) => apt.date === 'hackathon');

          let doctorAppointments = [];
          const aptRes = await fetch(`${apiUrl}/appointments/doctor/${user.id}`);
          
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
          } else {
            const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            // For Hackathon Demo: All appointments are immediate and visible
            doctorAppointments = allAppointments.filter((apt: any) => 
               apt.doctor_id === user.id || apt.doctorId === user.id
            ).map((apt: any) => ({ ...apt, status: 'confirmed' }));
          }

          // Always merge hackathon appointments for the demo
          doctorAppointments = [...doctorAppointments, ...hackathonApts];

          // Deduplicate by ID
          const uniqueAppointments = doctorAppointments.reduce((acc: any[], current: any) => {
            if (!acc.find(item => item.id === current.id)) {
              return acc.concat([current]);
            }
            return acc;
          }, []);

          setRecentAppointments(uniqueAppointments.slice(0, 5));
          localStorage.setItem('appointments', JSON.stringify(doctorAppointments));

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
            if (apt.date === 'hackathon') return true;
            const isToday = normalizeDate(apt.date) === normalizeDate(today);
            return isToday && apt.status !== 'completed';
          });

          const completedApts = doctorAppointments.filter((apt: any) => {
            const isOver = getAppointmentTimeStatus(apt.date, apt.time) === 'over';
            const isPast = normalizeDate(apt.date) < normalizeDate(today);
            return apt.status === 'completed' || isOver || (isPast && (apt.status === 'upcoming' || apt.status === 'confirmed'));
          }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setTodayAppointments(todayApts);
          setPastAppointments(completedApts.slice(0, 3));


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
              qualifications: '',
              consultationFee: '11',
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
            fullName: user.fullName || (user.unsafeMetadata?.fullName as string) || 'Doctor',
            email: user.primaryEmailAddress?.emailAddress || '',
            phone: (user.unsafeMetadata?.phone as string) || '',
            address: (user.unsafeMetadata?.address as string) || '',
            specialization: (user.unsafeMetadata?.specialization as string) || 'General',
            experience: (user.unsafeMetadata?.experience as string) || '0',
            qualifications: (user.unsafeMetadata?.qualifications as string) || '',
            consultationFee: '11',
            about: (user.unsafeMetadata?.bio as string) || '',
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
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
    { label: 'Total Patients', value: profileData.totalPatients.toString(), icon: Users, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Total Consultations', value: profileData.totalConsultations.toString(), icon: TrendingUp, color: 'bg-indigo-500/10 text-indigo-600' },
    { label: 'Avg Rating', value: profileData.rating.toString(), icon: Activity, color: 'bg-amber-500/10 text-amber-600' },
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
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary transition-colors">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="h-6 w-[1px] bg-slate-100 hidden sm:block"></div>
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-8 w-8' } }} />
            </div>

          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 pb-28 max-w-5xl">
        {/* Welcome Section */}
        <div className="mb-12 p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="space-y-3 relative z-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">नमस्ते, Dr. {profileData.fullName.split(' ')[0]}</h2>
            <p className="text-lg font-bold text-slate-400">{formattedDate}</p>
            <div className="inline-flex items-center px-4 py-1.5 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mt-4 border border-primary/10">
              <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
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
              onClick={() => {
                const readyApt = todayAppointments[0];
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] bg-white rounded-3xl overflow-hidden hover:-translate-y-1 transition-all duration-300">

              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className={cn("p-4 rounded-2xl", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
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
        <Card className="mb-12 shadow-[0_30px_60px_rgba(0,0,0,0.04)] overflow-hidden border-slate-100 rounded-[2.5rem]">
          <CardHeader className="flex flex-row items-center justify-between py-10 bg-slate-50/50 px-10 border-b border-slate-100">
            <CardTitle className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-widest">आज की नियुक्तियां</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="px-8 h-12 text-[10px] font-black uppercase tracking-widest border-2 rounded-xl"
              onClick={() => router.push('/doctor/appointments')}
            >
              Full Schedule
            </Button>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col sm:flex-row items-center justify-between p-6 border border-slate-100 rounded-[2rem] bg-white gap-6 hover:border-primary/20 hover:shadow-xl transition-all group">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Badge className={cn(
                    "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all",
                    appointment.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      appointment.status === 'cancelled' ? "bg-rose-50 text-rose-600 border-rose-100" :
                        "bg-primary/5 text-primary border-primary/10"
                  )}>
                    {appointment.status}
                  </Badge>
                  <div className="relative shrink-0">
                    <Avatar className="w-20 h-20 border-2 border-slate-100 p-1">
                      <AvatarImage src={appointment.avatar} className="rounded-2xl" />
                      <AvatarFallback className="bg-slate-50 text-primary text-xl font-black rounded-2xl">
                        {appointment.patientName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-white">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-slate-800 tracking-tight">{appointment.patientName}</p>
                    <p className="text-xs font-bold text-primary italic capitalize">"{appointment.symptoms?.join(', ') || 'General Visit'}"</p>
                    <div className="flex items-center text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      {appointment.time}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <>
                      <Button
                        variant="premium"
                        className="h-14 px-8 text-xs font-black rounded-2xl shadow-xl shadow-emerald-200/50 bg-emerald-500 hover:bg-emerald-600 border-none text-white transition-all transform hover:scale-105"
                        onClick={() => router.push(`/doctor/consultation/${appointment.id}`)}
                      >
                        <Video className="w-5 h-5 mr-3" />
                        Start Demo Room
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-14 px-6 text-xs font-black rounded-2xl border-2 border-slate-100 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-500 hover:bg-emerald-50/50"
                        onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                      >
                        Finish
                      </Button>
                    </>
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

        {/* Recent Past Appointments */}
        {pastAppointments.length > 0 && (
          <Card className="mb-12 shadow-[0_30px_60px_rgba(0,0,0,0.04)] overflow-hidden border-slate-100 rounded-[2.5rem]">
            <CardHeader className="flex flex-row items-center justify-between py-8 bg-slate-50/30 px-10 border-b border-slate-100">
              <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">पिछली मुलाक़ातें (Recent Visits)</CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              {pastAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-5 border border-slate-50 rounded-[1.5rem] bg-white gap-4 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12 border p-0.5">
                      <AvatarImage src={appointment.avatar} />
                      <AvatarFallback className="bg-slate-50 text-primary text-sm font-bold">
                        {appointment.patientName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-slate-800">{appointment.patientName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(appointment.date).toLocaleDateString()} • {appointment.time}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-50 text-green-600 border-green-100 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-lg">
                    Completed
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}


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
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 h-20 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto px-10 h-full max-w-5xl">
          <div className="flex justify-around items-center h-full">
            <Link href="/doctor/dashboard" className="flex-1">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-primary gap-1 px-4 group active:bg-primary/5 rounded-none"
              >
                <Home className="w-6 h-6 transition-none group-active:scale-90" />
                <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
              </Button>
            </Link>
            <Link href="/doctor/appointments" className="flex-1">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-slate-400 gap-1 px-4 group active:bg-primary/5 rounded-none hover:text-primary"
              >
                <CalendarDays className="w-6 h-6 transition-none group-active:scale-90" />
                <span className="text-[9px] font-black uppercase tracking-widest">Visits</span>
              </Button>
            </Link>
            <Link href="/doctor/patients" className="flex-1">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-slate-400 gap-1 px-4 group active:bg-primary/5 rounded-none hover:text-primary"
              >
                <Users className="w-6 h-6 transition-none group-active:scale-90" />
                <span className="text-[9px] font-black uppercase tracking-widest">Patients</span>
              </Button>
            </Link>
            <Link href="/doctor/profile" className="flex-1">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-slate-400 gap-1 px-4 group active:bg-primary/5 rounded-none hover:text-primary"
              >
                <User className="w-6 h-6 transition-none group-active:scale-90" />
                <span className="text-[9px] font-black uppercase tracking-widest">Me</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>


    </div>
  );
}
