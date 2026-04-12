'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/language-context';
import { MedicineTracker } from '@/components/medicine-tracker';
import { DhanvantariDrishti } from '@/components/dhanvantari-drishti';
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
import { getAppointmentTimeStatus, cn } from '@/lib/utils';
interface Appointment {
  id: string;
  patientId: string;  // 🔹 Add this
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  type: 'video' | 'phone';
  status: 'upcoming' | 'completed' | 'cancelled' | 'confirmed' | 'pending';
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

interface Doctor {
  _id: string;
  id: number;
  name: string;
  specialization: string;
  experience: string;
  qualifications: string;
  consultationFee: number;
  rating: number;
  avatar?: string;
  about?: string;
  languages?: string[];
}

export default function PatientDashboard() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { t } = useLanguage();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);

  const [profileData, setProfileData] = useState<PatientProfile | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [statsData, setStatsData] = useState({
    upcomingCount: '0',
    totalConsultations: '0',
    medicalRecords: '0',
    healthScore: '100%'
  });

  useEffect(() => {
    if (!isLoaded || !user) return;

    if (user.unsafeMetadata?.role !== 'patient') {
      router.push('/');
      return;
    }

    // Cache-First: Load from localStorage immediately for instant UI
    const localProfile = localStorage.getItem(`patient_profile_${user.id}`);
    const localApts = localStorage.getItem('appointments');
    
    if (localProfile) {
      setProfileData(JSON.parse(localProfile));
    }
    
    if (localApts) {
      const storedAppointments = JSON.parse(localApts).filter((apt: any) =>
        apt.patientId === user.id || (apt.patient_id === user.id)
      );
      const today = new Date().toISOString().split('T')[0];
      const upcoming = storedAppointments.filter((apt: any) => {
        const isHackathon = apt.date === 'hackathon' || apt.doctorName?.toLowerCase().includes("gajraj pandey");
        return isHackathon || (['upcoming', 'confirmed', 'pending'].includes(apt.status?.toLowerCase()) && apt.date >= today);
      });
      setUpcomingAppointments(upcoming.slice(0, 3));
      setStatsData(prev => ({
        ...prev,
        upcomingCount: upcoming.length.toString(),
        totalConsultations: storedAppointments.length.toString()
      }));
    }

    // Fetch profile from Backend (Supabase)
    const fetchProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
        const res = await fetch(`${apiUrl}/users/patient/${user.id}`);
        if (res.ok) {
          const remoteProfile = await res.json();
          // Map snake_case from Supabase to camelCase for the frontend
          const mappedProfile = {
            fullName: remoteProfile.name,
            email: remoteProfile.email,
            phone: remoteProfile.phone,
            dateOfBirth: remoteProfile.date_of_birth,
            gender: remoteProfile.gender,
            bloodGroup: remoteProfile.blood_group,
            height: remoteProfile.height,
            weight: remoteProfile.weight,
            address: remoteProfile.address,
            emergencyContact: remoteProfile.emergency_contact,
            allergies: remoteProfile.allergies,
            currentMedications: remoteProfile.current_medications,
            userId: remoteProfile.clerk_id
          };
          setProfileData(mappedProfile as PatientProfile);
          // Also sync to localStorage for offline/backup
          localStorage.setItem(`patient_profile_${user.id}`, JSON.stringify(mappedProfile));
        } else {
          // Fallback to localStorage if API fails
          const storedProfile = localStorage.getItem(`patient_profile_${user.id}`);
          if (storedProfile) {
            setProfileData(JSON.parse(storedProfile));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback on network error (backend down)
        const storedProfile = localStorage.getItem(`patient_profile_${user.id}`);
        if (storedProfile) {
          setProfileData(JSON.parse(storedProfile));
        } else {
          // Minimal fallback
          setProfileData({
            fullName: user.fullName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            userId: user.id
          } as any);
        }
      }
    };
    fetchProfile();

    // Load appointments from Backend (Supabase)
    const fetchAppointments = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
        const res = await fetch(`${apiUrl}/appointments/patient/${user.id}`);
        if (res.ok) {
          const remoteAppointments = await res.json();
          // Map snake_case from Supabase if needed, but the API seems to return what we want
          const userAppointments = remoteAppointments.filter((apt: any) =>
            apt.patientId === user.id || (apt.patient_id === user.id)
          ).map((apt: any) => ({
            ...apt,
            patientId: apt.patient_id || apt.patientId,
            doctorId: apt.doctor_id || apt.doctorId,
            doctorName: apt.doctor_name || apt.doctorName,
            doctorSpecialization: apt.doctor_specialization || apt.doctorSpecialization,
            consultationFee: apt.consultation_fee || apt.consultationFee,
            paymentStatus: apt.status === 'pending' ? 'pending' : (apt.payment_status || apt.paymentStatus)
          }));

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

          const today = new Date().toISOString().split('T')[0];
          const todayStr = normalizeDate(today);
          const upcoming = userAppointments.filter((apt: Appointment) => {
            const status = apt.status?.toLowerCase();
            const normalizedAptDate = normalizeDate(apt.date);
            const isHackathon = apt.date === 'hackathon' || apt.doctorName?.toLowerCase().includes("gajraj pandey");
            return isHackathon || ((status === 'upcoming' || status === 'confirmed' || status === 'pending') && normalizedAptDate >= todayStr);
          });

          const past = userAppointments.filter((apt: Appointment) => {
            const status = apt.status?.toLowerCase();
            const normalizedAptDate = normalizeDate(apt.date);
            const isPast = normalizedAptDate < todayStr;
            return status === 'completed' || (isPast && (status === 'upcoming' || status === 'confirmed'));
          }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setUpcomingAppointments(upcoming.slice(0, 3));
          setPastAppointments(past.slice(0, 3));
          setStatsData(prev => ({
            ...prev,
            upcomingCount: upcoming.length.toString(),
            totalConsultations: userAppointments.length.toString()
          }));


          // Sync to localStorage
          localStorage.setItem('appointments', JSON.stringify(userAppointments));
        } else {
          // Fallback to localStorage
          const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
          const userAppointments = storedAppointments.filter((apt: any) =>
            apt.patientId === user.id || (apt.patient_id === user.id)
          );
          const today = new Date().toISOString().split('T')[0];
          const upcoming = userAppointments.filter((apt: any) => {
            const status = apt.status?.toLowerCase();
            const isHackathon = apt.date === 'hackathon' || apt.doctorName?.toLowerCase().includes("gajraj pandey");
            return isHackathon || ((status === 'upcoming' || status === 'confirmed' || status === 'pending') && apt.date >= today);
          });
          setUpcomingAppointments(upcoming.slice(0, 3));
          setStatsData(prev => ({
            ...prev,
            upcomingCount: upcoming.length.toString(),
            totalConsultations: userAppointments.length.toString()
          }));
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };
    fetchAppointments();

    // Load medical records from Backend (Supabase)
    const fetchRecords = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
        const res = await fetch(`${apiUrl}/records/${user.id}`);
        if (res.ok) {
          const records = await res.json();
          const totalRecords = records.length;
          
          setStatsData(prev => ({
            ...prev,
            medicalRecords: totalRecords.toString(),
            healthScore: totalRecords > 0 ? "95%" : "100%"
          }));
        }
      } catch (error) {
        console.error('Error fetching medical records:', error);
      }
    };
    fetchRecords();

    // Fetch doctors
    const fetchDoctors = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
        const res = await fetch(`${apiUrl}/doctors`);
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.slice(0, 4)); // Show top 4 doctors
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };
    fetchDoctors();

  }, [isLoaded, router, user]);

  if (!isLoaded || !user) {
    return null;
  }

  const stats = [
    { label: 'Upcoming Appointments', value: statsData.upcomingCount, icon: Calendar, color: 'bg-primary/10 text-primary' },
    { label: 'Total Consultations', value: statsData.totalConsultations, icon: Video, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Medical Records', value: statsData.medicalRecords, icon: FileText, color: 'bg-indigo-500/10 text-indigo-600' },
    { label: 'Health Score', value: statsData.healthScore, icon: Heart, color: 'bg-rose-500/10 text-rose-600' },
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
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">नमस्ते, {user.firstName}</h2>
            <p className="text-lg font-bold text-slate-400">{formattedDate}</p>
            <div className="inline-flex items-center px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mt-4 border border-emerald-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Secure & Encrypted
            </div>

          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button
              onClick={() => router.push('/patient/appointments/book')}
              variant="premium"
              className="h-12 px-8 text-base rounded-2xl font-bold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Book Doctor
            </Button>
            <Button
              onClick={() => router.push('/patient/appointments')}
              variant="outline"
              className="h-12 px-8 text-base rounded-2xl border-2 border-primary/40 hover:bg-primary/10 transition-colors font-bold text-primary"
            >
              <Calendar className="w-5 h-5 mr-2" />
              My Appointments
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


        {/* Profile Information */}
        {profileData && (
          <Card className="mb-8 border">
            <CardHeader className="border-b py-4">
              <CardTitle className="flex items-center text-lg font-bold">
                <User className="w-5 h-5 mr-3 text-primary" />
                मेरी जानकारी (My Profile)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-primary uppercase tracking-widest border-l-2 border-primary pl-3">Personal Info</h4>
                  <div className="grid gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">पूरा नाम (Full Name)</p>
                      <p className="text-lg font-semibold text-foreground">{profileData.fullName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">फोन (Phone)</p>
                        <p className="text-base font-semibold text-foreground">{profileData.phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Gender</p>
                        <p className="text-base font-semibold text-foreground capitalize">{profileData.gender}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">पता (Address)</p>
                      <p className="text-base font-semibold text-foreground">{profileData.address || 'Not Added'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-secondary uppercase tracking-widest border-l-2 border-secondary pl-3">Medical Info</h4>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-muted rounded-xl text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Blood</p>
                        <p className="text-lg font-bold text-red-500">{profileData.bloodGroup || '-'}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-xl text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Height</p>
                        <p className="text-lg font-bold text-blue-500">{profileData.height || '-'} cm</p>
                      </div>
                      <div className="p-3 bg-muted rounded-xl text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Weight</p>
                        <p className="text-lg font-bold text-green-500">{profileData.weight || '-'} kg</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Allergies (एलर्जी)</p>
                      <p className="text-base font-semibold text-red-400">{profileData.allergies || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Medications (दवाइयाँ)</p>
                      <p className="text-base font-semibold text-foreground">{profileData.currentMedications || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Appointments */}
        <Card className="mb-12 shadow-[0_30px_60px_rgba(0,0,0,0.04)] overflow-hidden border-slate-100 rounded-[2.5rem]">
          <CardHeader className="flex flex-row items-center justify-between py-10 bg-slate-50/50 px-10 border-b border-slate-100">
            <CardTitle className="text-3xl font-black text-slate-900 tracking-tight uppercase">आने वाली मुलाक़ात</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="px-8 h-12 text-[10px] font-black uppercase tracking-widest border-2 rounded-xl"
              onClick={() => router.push('/patient/appointments')}
            >
              See All
            </Button>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col sm:flex-row items-center justify-between p-6 border border-slate-100 rounded-[2rem] bg-white gap-6 hover:border-primary/30 hover:shadow-xl transition-all group">
                <div className="flex items-center space-x-6 w-full sm:w-auto">
                  <div className="relative shrink-0">
                    <Avatar className="w-20 h-20 border-2 border-slate-100 p-1">
                      <AvatarImage src={appointment.avatar} className="rounded-2xl" />
                      <AvatarFallback className="bg-slate-50 text-primary text-xl font-black rounded-2xl">
                        {appointment.doctorName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-white">
                      <Video className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-slate-800 tracking-tight">{appointment.doctorName}</p>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">{appointment.doctorSpecialization}</p>
                    <div className="flex flex-wrap items-center text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 gap-x-4">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(appointment.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{appointment.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Badge
                    className={cn("h-10 px-6 text-[10px] font-black rounded-xl uppercase tracking-widest", (appointment.status === 'confirmed' || appointment.status === 'upcoming') ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400")}
                    variant="outline"
                  >
                    {getAppointmentTimeStatus(appointment.date, appointment.time) === 'over' ? 'Finished' : (appointment.status.toUpperCase())}
                  </Badge>
                  {getAppointmentTimeStatus(appointment.date, appointment.time) === 'ready' && (
                    <Button
                      variant="premium"
                      size="sm"
                      className="h-14 px-8 text-xs font-black rounded-2xl shadow-xl shadow-primary/20"
                      onClick={() => router.push(`/patient/consultation/${appointment.id}`)}
                    >
                      <Video className="w-5 h-5 mr-3" />
                      Join Now
                    </Button>
                  )}
                  {appointment.date === 'hackathon' && (
                    <Button
                      variant="premium"
                      size="sm"
                      className="h-14 px-8 text-xs font-black rounded-2xl shadow-xl shadow-emerald-200/50 bg-emerald-500 hover:bg-emerald-600 border-none text-white transition-all transform hover:scale-105"
                      onClick={() => router.push(`/patient/consultation/${appointment.id}`)}
                    >
                      <Video className="w-5 h-5 mr-3" />
                      Direct Join
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {upcomingAppointments.length === 0 && (
              <div className="text-center py-20 space-y-8">
                <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-14 h-14 text-slate-300" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-extrabold text-slate-800">कोई मुलाक़ात नहीं</p>
                  <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">No Appointments Found</p>
                </div>
                <Button
                  onClick={() => router.push('/patient/appointments/book')}
                  size="lg"
                  className="h-20 px-12 text-xl bg-primary text-black hover:bg-primary/90"
                >
                  <Plus className="w-7 h-7 mr-4" />
                  Book Now
                </Button>
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
                        {appointment.doctorName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-slate-800">{appointment.doctorName}</p>
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


        {/* Available Doctors */}
        <Card className="mb-12 border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.03)] bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-8 px-10 border-b border-slate-50">
            <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">हमारे डॉक्टर (Available Doctors)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="px-6 h-10 text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200"
              onClick={() => router.push('/patient/appointments/book')}
            >
              See All
            </Button>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <Card key={doctor._id || doctor.id} className="group cursor-pointer border border-slate-50 shadow-none overflow-hidden hover:border-primary/20 hover:shadow-xl transition-all rounded-[2rem] bg-slate-50/30" onClick={() => router.push(`/patient/appointments/book`)}>
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                      <Avatar className="w-20 h-20 border-2 border-white transition-transform group-hover:scale-105 shadow-md">
                        <AvatarImage src={doctor.avatar} />
                        <AvatarFallback className="bg-white">
                          <Stethoscope className="h-10 w-10 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="font-black text-lg text-slate-800 tracking-tight">{doctor.name}</h3>
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest">{doctor.specialization}</p>
                      </div>
                      <div className="flex items-center justify-center gap-3 w-full py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-sm font-black text-slate-900 font-mono">₹{doctor.consultationFee}</span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{doctor.experience}Y EXP</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-slate-300 font-black text-xl uppercase tracking-widest">
                  डॉक्टर अभी उपलब्ध नहीं हैं
                </div>
              )}
            </div>
          </CardContent>
        </Card>


        {/* Health Tips & Emergency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-2xl shadow-rose-100/50 border-rose-100 bg-rose-50 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform" />
            <CardHeader className="py-8 px-10">
              <CardTitle className="flex items-center text-2xl font-black text-rose-600 tracking-tight uppercase">
                <AlertCircle className="w-8 h-8 mr-4" />
                आपातकालीन
              </CardTitle>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-6 relative z-10">
              <p className="text-sm text-rose-900/60 font-medium">Any health emergency? Call our 24/7 medical support team immediately.</p>
              <Button
                variant="destructive"
                className="w-full h-16 text-xl font-black rounded-2xl bg-rose-600 hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
              >
                <Phone className="w-6 h-6 mr-4 animate-pulse" />
                CALL HELP: 102
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-2xl shadow-emerald-100/50 border-emerald-100 bg-emerald-50 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform" />
            <CardHeader className="py-8 px-10">
              <CardTitle className="flex items-center text-2xl font-black text-emerald-600 tracking-tight uppercase">
                <Heart className="w-8 h-8 mr-4" />
                स्वास्थ्य सलाह
              </CardTitle>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-4 relative z-10">
              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-[1.5rem] flex items-center gap-4 border border-white">
                <span className="text-3xl shrink-0">💧</span>
                <div>
                  <p className="text-sm font-black text-slate-800">पानी पीते रहें</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stay Hydrated</p>
                </div>
              </div>
              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-[1.5rem] flex items-center gap-4 border border-white">
                <span className="text-3xl shrink-0">😴</span>
                <div>
                  <p className="text-sm font-black text-slate-800">पूरी नींद लें</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Good Sleep</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Files', sub: 'Reports', icon: FileText, color: 'bg-indigo-50 text-indigo-600', path: '/patient/records' },
            { label: 'Doctors', sub: 'Book Now', icon: Stethoscope, color: 'bg-primary/10 text-primary', path: '/patient/appointments/book' },
            { label: 'Profile', sub: 'Edit Info', icon: User, color: 'bg-amber-50 text-amber-600', path: '/patient/profile' },
            { label: 'Medicines', sub: 'Track', icon: Pill, color: 'bg-emerald-50 text-emerald-600', path: '/patient/medicine-tracker' },
          ].map((action, i) => (
            <Card key={i} className="group cursor-pointer border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:bg-slate-50 transition-all duration-200 rounded-[2rem] bg-white overflow-hidden" onClick={() => router.push(action.path)}>

              <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6", action.color)}>
                  <action.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-800 tracking-tight">{action.label}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{action.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>


        {/* Dhanvantari Drishti Section */}
        <div className="mb-8">
          <DhanvantariDrishti />
        </div>

        {/* Medicine Tracker Section */}
        <Card className="mb-8 border shadow-none">
          <CardHeader className="py-4 px-6 border-b">
            <CardTitle className="flex items-center text-lg font-bold">
              <Pill className="w-5 h-5 mr-3 text-primary" />
              दवा की जानकारी (Medicine Tracker)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <MedicineTracker />
          </CardContent>
        </Card>
      </main >

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 h-20 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto px-10 h-full max-w-5xl">
          <div className="flex justify-around items-center h-full">
            <Link href="/patient/dashboard" className="flex-1">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-primary gap-1 px-4 group active:bg-primary/5 rounded-none"
              >
                <Home className="w-6 h-6 transition-none group-active:scale-90" />
                <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
              </Button>
            </Link>
            <Link href="/patient/appointments" className="flex-1">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-slate-400 gap-1 px-4 group active:bg-primary/5 rounded-none hover:text-primary"
              >
                <CalendarDays className="w-6 h-6 transition-none group-active:scale-90" />
                <span className="text-[9px] font-black uppercase tracking-widest">Dates</span>
              </Button>
            </Link>
            <Link href="/patient/records" className="flex-1">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-slate-400 gap-1 px-4 group active:bg-primary/5 rounded-none hover:text-primary"
              >
                <FileText className="w-6 h-6 transition-none group-active:scale-90" />
                <span className="text-[9px] font-black uppercase tracking-widest">Files</span>
              </Button>
            </Link>
            <Link href="/patient/profile" className="flex-1">
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


    </div >
  );
}
