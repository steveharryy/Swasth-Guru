'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { BackendStatusPanel } from '@/components/backend-status-panel';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSocket } from '@/lib/socket';
import { cn, getApiUrl } from '@/lib/utils';
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
  Bell,
  TrendingUp,
  Activity,
  Phone,
  Loader2
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
  const { language, t } = useLanguage();
  const [profileData, setProfileData] = useState<DoctorProfile | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);

  // Navigation button loading states
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [activeConsultationLoading, setActiveConsultationLoading] = useState<string | null>(null);
  const [activeFinishLoading, setActiveFinishLoading] = useState<string | null>(null);
  const [isPatientsLoading, setIsPatientsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    if (user.unsafeMetadata?.role !== 'doctor') {
      router.push('/');
      return;
    }

    if (!user.unsafeMetadata?.onboardingComplete) {
      router.push('/onboarding');
      return;
    }

    // Pre-connect Socket.IO to avoid call latency
    try {
      getSocket();
    } catch (err) {
      console.warn('Socket preconnection skipped:', err);
    }

    // Prefetch doctor routes
    router.prefetch('/doctor/appointments');
    router.prefetch('/doctor/patients');
    router.prefetch('/doctor/profile');

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

    const loadDoctorData = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/users/doctor/${user.id}`);
        if (res.ok) {
          const remoteProfile = await res.json();
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
          const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
          const hackathonApts = storedAppointments.filter((apt: any) => apt.date === 'hackathon');

          let doctorAppointments = [];
          const [idRes, globalRes] = await Promise.allSettled([
            fetch(`${apiUrl}/appointments/doctor/${user.id}`),
            fetch(`${apiUrl}/appointments`)
          ]);

          let fromId = idRes.status === 'fulfilled' && idRes.value.ok ? await idRes.value.json() : [];
          let allGlobal = globalRes.status === 'fulfilled' && globalRes.value.ok ? await globalRes.value.json() : [];

          const nameToMatch = (mappedProfile.fullName || 'Doctor').toLowerCase().trim();
          let nameMatchedGlobal = allGlobal.filter((apt: any) => {
            const aptName = (apt.doctorName || apt.doctor_name || '').toLowerCase().trim();
            const idMatch = apt.doctorId === user.id || apt.doctor_id === user.id;
            const nameMatch = aptName.includes(nameToMatch) || nameToMatch.includes(aptName);
            return idMatch || nameMatch;
          });

          if (nameMatchedGlobal.length === 0 && allGlobal.length > 0) {
            nameMatchedGlobal = allGlobal.slice(0, 5);
          }

          const allLocalApts = JSON.parse(localStorage.getItem('appointments') || '[]');
          const nameMatchedLocal = allLocalApts.filter((apt: any) => {
            const aptName = (apt.doctorName || apt.doctor_name || '').toLowerCase().trim();
            const nameMatch = aptName.includes(nameToMatch) || nameToMatch.includes(aptName);
            return nameMatch || apt.doctorId === user.id || apt.doctor_id === user.id;
          });

          doctorAppointments = [...fromId, ...nameMatchedGlobal, ...nameMatchedLocal].map((apt: any) => ({
            ...apt,
            id: apt.id?.toString() || Date.now().toString(),
            patientId: apt.patient_id || apt.patientId,
            doctorId: apt.doctor_id || apt.doctorId,
            doctorName: apt.doctor_name || apt.doctorName,
            patientName: apt.patient?.name || apt.patient_name || apt.patientName || 'Patient',
            status: apt.status?.toLowerCase() || 'confirmed',
            date: apt.date,
            time: apt.time
          }));

          doctorAppointments = [...doctorAppointments, ...hackathonApts];

          const uniqueAppointments = doctorAppointments.reduce((acc: any[], current: any) => {
            if (!acc.find(item => item.id === current.id)) {
              return acc.concat([current]);
            }
            return acc;
          }, []);

          const allMatchingApts = uniqueAppointments.filter((apt: any) => apt.status !== 'cancelled');
          const sortedApts = allMatchingApts.sort((a: any, b: any) => 
            new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()
          );

          setRecentAppointments(sortedApts.slice(0, 5));
          setTodayAppointments(sortedApts);
          
          const completedApts = sortedApts.filter(apt => apt.status === 'completed');
          setPastAppointments(completedApts.slice(0, 3));

          const totalPatients = new Set(allMatchingApts.map((apt: any) => apt.patientId)).size;
          const totalConsultations = allMatchingApts.length;

          setProfileData(prev => prev ? {
            ...prev,
            totalPatients,
            totalConsultations
          } : null);
        } else {
          const storedProfile = localStorage.getItem(`doctor_profile_${user.id}`);
          const fallbackName = storedProfile
            ? JSON.parse(storedProfile).fullName
            : (user.fullName || (user.unsafeMetadata?.fullName as string) || '');

          if (storedProfile) {
            setProfileData(JSON.parse(storedProfile));
          } else {
            setProfileData({
              fullName: fallbackName || 'Doctor',
              email: user.primaryEmailAddress?.emailAddress || '',
              phone: (user.unsafeMetadata?.phone as string) || '',
              address: (user.unsafeMetadata?.address as string) || '',
              specialization: (user.unsafeMetadata?.specialization as string) || 'General',
              experience: (user.unsafeMetadata?.experience as string) || '0',
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

          const allLocalApts = JSON.parse(localStorage.getItem('appointments') || '[]');
          const nameToMatchFallback = fallbackName.toLowerCase().trim();
          const localMatched = allLocalApts.filter((apt: any) => {
            const aptName = (apt.doctorName || apt.doctor_name || '').toLowerCase().trim();
            return apt.doctorId === user.id ||
              apt.doctor_id === user.id ||
              aptName.includes(nameToMatchFallback) ||
              nameToMatchFallback.includes(aptName);
          });
          if (localMatched.length > 0) {
            setTodayAppointments(localMatched);
            setRecentAppointments(localMatched.slice(0, 5));
          }
        }
      } catch (err) {
        console.error("Failed to fetch doctor data:", err);
        const storedProfile = localStorage.getItem(`doctor_profile_${user.id}`);
        const catchFallbackName = storedProfile
          ? JSON.parse(storedProfile).fullName
          : (user.fullName || (user.unsafeMetadata?.fullName as string) || '');

        if (storedProfile) {
          setProfileData(JSON.parse(storedProfile));
        } else {
          setProfileData({
            fullName: catchFallbackName || 'Doctor',
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

        const allLocalApts = JSON.parse(localStorage.getItem('appointments') || '[]');
        const nameToMatchCatch = catchFallbackName.toLowerCase().trim();
        const localMatched = allLocalApts.filter((apt: any) => {
          const aptName = (apt.doctorName || apt.doctor_name || '').toLowerCase().trim();
          return apt.doctorId === user.id ||
            apt.doctor_id === user.id ||
            (nameToMatchCatch && (aptName.includes(nameToMatchCatch) || nameToMatchCatch.includes(aptName)));
        });
        if (localMatched.length > 0) {
          setTodayAppointments(localMatched);
          setRecentAppointments(localMatched.slice(0, 5));
        }
      }
    };

    loadDoctorData();
  }, [user, isLoaded, router]);

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    setActiveFinishLoading(appointmentId);
    try {
      const apiUrl = getApiUrl();
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
    } finally {
      setActiveFinishLoading(null);
    }
  };

  if (!isLoaded || !user || !profileData) {
    return null;
  }

  const stats = [
    { label: 'Today\'s Visits / आज के अपॉइंटमेंट', value: todayAppointments.length.toString(), icon: Calendar, color: 'bg-primary/10 text-primary' },
    { label: 'Total Patients / कुल मरीज़', value: profileData.totalPatients.toString(), icon: Users, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Consultations / कुल परामर्श', value: profileData.totalConsultations.toString(), icon: TrendingUp, color: 'bg-indigo-500/10 text-indigo-600' },
    { label: 'Avg Rating / औसत रेटिंग', value: profileData.rating.toFixed(1) + ' ★', icon: Activity, color: 'bg-amber-500/10 text-amber-600' },
  ];

  const date = new Date();
  const formattedDate = date.toLocaleDateString(language === 'hindi' ? 'hi-IN' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/95 border-b border-border backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <img src="/logo.png" alt="Swasth Guru Logo" className="h-16 w-auto object-contain" />
              <h1 className="text-2xl font-black logo-text hidden sm:block">SwasthGuru</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
                <Bell className="h-6 w-6" />
              </Button>
              <div className="h-6 w-[1px] bg-border"></div>
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-10 w-10' } }} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 pb-28 max-w-5xl">
        {/* Welcome Section */}
        <div className="mb-12 p-10 rounded-[2.5rem] bg-card border border-border shadow-[0_20px_40px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="space-y-3 relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              {language === 'hindi' ? 'नमस्ते' : 'Hello'}, Dr. {profileData.fullName.split(' ')[0]}
            </h2>
            <p className="text-base md:text-lg font-extrabold text-muted-foreground">{formattedDate}</p>
            <div className="inline-flex items-center px-4 py-2 bg-primary/5 text-primary rounded-full text-xs font-black uppercase tracking-wider mt-4 border border-primary/10">
              <span className="w-2.5 h-2.5 bg-primary rounded-full mr-2 animate-pulse"></span>
              {profileData.specialization} • Specialist / विशेषज्ञ
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
            {/* Schedule Button */}
            <Button
              onClick={() => {
                setIsScheduleLoading(true);
                router.push('/doctor/appointments');
              }}
              loading={isScheduleLoading}
              variant="outline"
              className="h-14 md:h-16 px-8 rounded-2xl border-2 border-primary/45 hover:bg-primary/5 transition-all text-primary font-black flex items-center justify-center"
            >
              <Calendar className="w-6 h-6 mr-2 shrink-0" />
              <div className="flex flex-col items-start leading-tight text-left">
                <span className="text-sm md:text-base font-extrabold">Schedule</span>
                <span className="text-xs font-semibold text-primary/70">समय-सारणी</span>
              </div>
            </Button>

            {/* Join Call Button (starts first ready call) */}
            <Button
              variant="premium"
              className="h-14 md:h-16 px-8 rounded-2xl font-black shadow-md border-2 border-primary/10 text-primary flex items-center justify-center"
              onClick={() => {
                const readyApt = todayAppointments.find(apt => apt.status !== 'completed');
                if (readyApt) {
                  setActiveConsultationLoading(readyApt.id);
                  router.push(`/doctor/consultation/${readyApt.id}`);
                }
              }}
              loading={activeConsultationLoading !== null}
              disabled={todayAppointments.length === 0}
            >
              <Video className="w-6 h-6 mr-2 shrink-0" />
              <div className="flex flex-col items-start leading-tight text-left">
                <span className="text-sm md:text-base font-extrabold text-[#001C3D]">Join Call</span>
                <span className="text-xs font-semibold text-[#001C3D]/70">कॉल से जुड़ें</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="border-border shadow-[0_10px_30px_rgba(0,0,0,0.02)] bg-card rounded-3xl overflow-hidden hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className={cn("p-4 rounded-2xl", stat.color)}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                  <p className="text-xs md:text-sm font-extrabold text-muted-foreground tracking-wide mt-2">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Network connection check panel */}
        <div className="mb-8">
          <BackendStatusPanel />
        </div>

        {/* Professional Profile */}
        <Card className="mb-8 border shadow-sm rounded-3xl">
          <CardHeader className="border-b py-5 px-6">
            <CardTitle className="flex items-center text-xl font-bold text-foreground">
              <Stethoscope className="w-6 h-6 mr-3 text-primary" />
              Professional Profile / मेरी जानकारी
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-primary uppercase tracking-wider border-l-3 border-primary pl-3">
                  Personal Details / विवरण
                </h4>
                <div className="grid gap-4">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Doctor's Name / डॉक्टर का नाम</p>
                    <p className="text-lg font-bold text-foreground">{profileData.fullName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Phone / फ़ोन</p>
                      <p className="text-base font-bold text-foreground">{profileData.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Email / ईमेल</p>
                      <p className="text-base font-bold text-foreground truncate">{profileData.email}</p>
                    </div>
                  </div>
                  {profileData.address && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Clinic Address / पता</p>
                      <p className="text-base font-semibold text-foreground">{profileData.address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-secondary uppercase tracking-wider border-l-3 border-secondary pl-3">
                  Clinical Info / क्लिनिकल जानकारी
                </h4>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Specialization / विशेषज्ञता</p>
                      <p className="text-base font-bold text-blue-500">{profileData.specialization}</p>
                    </div>
                    <div className="p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Experience / अनुभव</p>
                      <p className="text-base font-bold text-green-500">{profileData.experience} Years / साल</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Qualifications / योग्यता</p>
                    <p className="text-base font-bold text-foreground">{profileData.qualifications}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Fee per Call / शुल्क</p>
                      <p className="text-lg font-bold text-foreground">₹{profileData.consultationFee}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Rating / रेटिंग</p>
                      <p className="text-lg font-bold text-orange-500">{profileData.rating.toFixed(1)} ★</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {profileData.about && (
              <div className="mt-6 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">About the Practice / परिचय</p>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">"{profileData.about}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card className="mb-12 shadow-[0_30px_60px_rgba(0,0,0,0.04)] overflow-hidden border-border rounded-[2.5rem]">
          <CardHeader className="flex flex-row items-center justify-between py-8 bg-primary/5 px-10 border-b border-border">
            <CardTitle className="text-2xl font-black text-foreground tracking-tight uppercase">
              Today's Visits / आज की नियुक्तियां
            </CardTitle>
            <Button
              variant="outline"
              size="default"
              className="px-6 h-12 text-sm font-black border-2 rounded-xl"
              onClick={() => {
                setIsScheduleLoading(true);
                router.push('/doctor/appointments');
              }}
              loading={isScheduleLoading}
            >
              Full Schedule / पूरा कार्यक्रम
            </Button>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col md:flex-row items-center justify-between p-6 border border-border rounded-[2rem] bg-card gap-6 hover:border-primary/20 hover:shadow-xl transition-all group">
                <div className="flex items-center space-x-6 w-full md:w-auto">
                  <div className="relative shrink-0">
                    <Avatar className="w-20 h-20 border-2 border-border p-1">
                      <AvatarImage src={appointment.avatar} className="rounded-2xl" />
                      <AvatarFallback className="bg-muted text-primary text-xl font-black rounded-2xl">
                        {appointment.patientName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-white">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-foreground tracking-tight">{appointment.patientName}</p>
                    <p className="text-sm font-bold text-primary italic capitalize">"{appointment.symptoms?.join(', ') || 'General Visit'}"</p>
                    <div className="flex items-center text-xs text-muted-foreground font-bold uppercase tracking-wider mt-2 gap-2">
                      <Clock className="w-4 h-4" />
                      {appointment.time}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0">
                  {appointment.status !== 'completed' ? (
                    <>
                      <Button
                        variant="premium"
                        className="h-14 px-8 text-sm font-black rounded-2xl bg-emerald-500 hover:bg-emerald-600 border-none text-white transition-all transform w-full sm:w-auto flex items-center justify-center"
                        onClick={() => {
                          setActiveConsultationLoading(appointment.id);
                          router.push(`/doctor/consultation/${appointment.id}`);
                        }}
                        loading={activeConsultationLoading === appointment.id}
                      >
                        <Video className="w-5 h-5 mr-2 shrink-0 text-white" />
                        <div className="flex flex-col items-start leading-tight text-left">
                          <span className="font-extrabold text-white text-sm">Start Call</span>
                          <span className="text-xs font-semibold text-white/80">कॉल शुरू करें</span>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-14 px-6 text-sm font-black rounded-2xl border-2 border-border text-foreground/70 hover:border-emerald-500/30 hover:text-emerald-600 hover:bg-emerald-50 w-full sm:w-auto"
                        onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                        loading={activeFinishLoading === appointment.id}
                      >
                        Done / पूरा हुआ
                      </Button>
                    </>
                  ) : (
                    <Badge className="bg-green-50 text-green-600 border-green-100 uppercase text-xs font-black px-4 py-2 rounded-xl">
                      Completed / पूरा हुआ
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {todayAppointments.length === 0 && (
              <div className="text-center py-16 space-y-8">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-12 h-12 text-muted-foreground/60" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-extrabold text-foreground">No Appointments / कोई मुलाक़ात नहीं</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Past Appointments */}
        {pastAppointments.length > 0 && (
          <Card className="mb-12 shadow-[0_30px_60px_rgba(0,0,0,0.04)] overflow-hidden border-border rounded-[2.5rem]">
            <CardHeader className="flex flex-row items-center justify-between py-6 bg-primary/5 px-10 border-b border-border">
              <CardTitle className="text-xl font-black text-foreground tracking-tight uppercase">
                Recent Visits / पिछली मुलाक़ातें
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {pastAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-5 border border-border/50 rounded-[1.5rem] bg-card gap-4 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12 border p-0.5">
                      <AvatarImage src={appointment.avatar} />
                      <AvatarFallback className="bg-muted text-primary text-sm font-bold">
                        {appointment.patientName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-foreground text-base">{appointment.patientName}</p>
                      <p className="text-xs font-bold text-muted-foreground mt-0.5">{new Date(appointment.date).toLocaleDateString()} • {appointment.time}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-50 text-green-600 border-green-100 uppercase text-xs font-black px-3 py-1 rounded-lg">
                    Completed / पूरा हुआ
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Patient Files / मरीज़ के कागज़', icon: Users, color: 'bg-primary/10 text-primary', borderColor: 'hover:border-primary/40', path: '/doctor/patients', loadingSetter: setIsPatientsLoading, loadingVal: isPatientsLoading },
            { label: 'My Schedule / समय-सारणी', icon: Clock, color: 'bg-secondary/10 text-secondary', borderColor: 'hover:border-secondary/40', path: '/doctor/appointments', loadingSetter: setIsScheduleLoading, loadingVal: isScheduleLoading },
            { label: 'Profile Settings / प्रोफ़ाइल सेटिंग्स', icon: FileText, color: 'bg-orange-500/10 text-orange-500', borderColor: 'hover:border-orange-300', path: '/doctor/profile', loadingSetter: setIsProfileLoading, loadingVal: isProfileLoading },
          ].map((action, i) => (
            <Card 
              key={i} 
              className={cn(
                "group cursor-pointer border border-border shadow-[0_10px_30px_rgba(0,0,0,0.02)] bg-card overflow-hidden rounded-[2rem]",
                "hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-150",
                action.borderColor
              )}
              onClick={() => {
                action.loadingSetter(true);
                router.push(action.path);
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all group-hover:scale-110 relative", action.color)}>
                  {action.loadingVal ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <action.icon className="w-7 h-7" />
                  )}
                </div>
                <div className="w-full flex flex-col items-center">
                  <h3 className="font-black text-sm text-foreground tracking-tight leading-snug min-h-[40px] flex items-center justify-center text-center">
                    {action.label}
                  </h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-2xl border-t border-border h-20 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto px-10 h-full max-w-5xl">
          <div className="flex justify-around items-center h-full">
            <Link href="/doctor/dashboard" className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-primary gap-1 px-4 hover:bg-transparent focus:bg-transparent active:bg-transparent transition-colors duration-150 rounded-none"
              >
                <Home className="w-6 h-6" />
                <span className="text-xs font-extrabold uppercase tracking-wide">Home / मुख्य</span>
              </Button>
            </Link>
            <Link href="/doctor/appointments" className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-muted-foreground gap-1 px-4 hover:text-primary hover:bg-transparent focus:bg-transparent active:bg-transparent transition-colors duration-150 rounded-none"
              >
                <CalendarDays className="w-6 h-6" />
                <span className="text-xs font-extrabold uppercase tracking-wide">Visits / नियुक्तियां</span>
              </Button>
            </Link>
            <Link href="/doctor/patients" className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-muted-foreground gap-1 px-4 hover:text-primary hover:bg-transparent focus:bg-transparent active:bg-transparent transition-colors duration-150 rounded-none"
              >
                <Users className="w-6 h-6" />
                <span className="text-xs font-extrabold uppercase tracking-wide">Patients / मरीज़</span>
              </Button>
            </Link>
            <Link href="/doctor/profile" className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-muted-foreground gap-1 px-4 hover:text-primary hover:bg-transparent focus:bg-transparent active:bg-transparent transition-colors duration-150 rounded-none"
              >
                <User className="w-6 h-6" />
                <span className="text-xs font-extrabold uppercase tracking-wide">Profile / मेरी प्रोफ़ाइल</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
