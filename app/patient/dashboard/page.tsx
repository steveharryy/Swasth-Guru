'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/language-context';
import { MedicineTracker } from '@/components/medicine-tracker';
import { DhanvantariDrishti } from '@/components/dhanvantari-drishti';
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

    if (!user.unsafeMetadata?.onboardingComplete) {
      router.push('/onboarding');
      return;
    }

    // Fetch profile from Backend (Supabase)
    const fetchProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
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
          setUpcomingAppointments(upcoming.slice(0, 3));
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
            return (status === 'upcoming' || status === 'confirmed' || status === 'pending') && apt.date >= today;
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
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
    { label: 'Total Consultations', value: statsData.totalConsultations, icon: Video, color: 'bg-secondary/10 text-secondary' },
    { label: 'Medical Records', value: statsData.medicalRecords, icon: FileText, color: 'bg-accent/10 text-accent' },
    { label: 'Health Score', value: statsData.healthScore, icon: Heart, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' },
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
            <h2 className="text-3xl font-bold text-foreground">नमस्ते, {user.firstName}</h2>
            <p className="text-lg text-muted-foreground">{formattedDate}</p>
            <div className="inline-flex items-center px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium mt-2 border border-green-500/20">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              All services ready
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
        <Card className="mb-10 shadow-lg overflow-hidden border-2 border-primary/5">
          <CardHeader className="flex flex-row items-center justify-between py-8 bg-primary/5 px-8">
            <CardTitle className="text-2xl font-bold text-slate-800">आने वाली मुलाक़ात (Upcoming)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="px-6 h-12 text-base font-bold border-2"
              onClick={() => router.push('/patient/appointments')}
            >
              See All
            </Button>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-2xl bg-card gap-4 hover:border-primary/20 transition-all">
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className="relative shrink-0">
                    <Avatar className="w-16 h-16 border-2">
                      <AvatarImage src={appointment.avatar} />
                      <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                        {appointment.doctorName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-black p-1.5 rounded-full shadow-lg border-2 border-background">
                      <Video className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-lg font-bold text-foreground">{appointment.doctorName}</p>
                    <p className="text-sm font-medium text-primary">{appointment.doctorSpecialization}</p>
                    <div className="flex flex-wrap items-center text-xs text-muted-foreground font-medium mt-1 gap-x-3">
                      <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" />{new Date(appointment.date).toLocaleDateString()}</span>
                      <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" />{appointment.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <Badge
                    className={cn("h-8 px-4 text-xs font-bold rounded-full", (appointment.status === 'confirmed' || appointment.status === 'upcoming') && "text-black")}
                    variant={getAppointmentTimeStatus(appointment.date, appointment.time) === 'over' ? 'destructive' : (appointment.status === 'confirmed' ? 'default' : 'secondary')}
                  >
                    {getAppointmentTimeStatus(appointment.date, appointment.time) === 'over' ? 'Finished' : (appointment.status.toUpperCase())}
                  </Badge>
                  {getAppointmentTimeStatus(appointment.date, appointment.time) === 'ready' && (
                    <Button
                      variant="premium"
                      size="sm"
                      className="h-11 px-6 text-base font-bold shadow-md border-2 border-primary/20"
                      onClick={() => router.push(`/patient/consultation/${appointment.id}`)}
                    >
                      <Video className="w-5 h-5 mr-3 text-primary" />
                      Join Now
                    </Button>
                  )}
                  {getAppointmentTimeStatus(appointment.date, appointment.time) === 'early' && (
                    <div className="text-center px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-bold border border-blue-500/20">
                      Joins in some time
                    </div>
                  )}
                  {appointment.date === 'hackathon' && (
                    <Button
                      variant="premium"
                      size="sm"
                      className="h-11 px-6 text-base font-bold shadow-md border-2 border-primary/20 bg-green-500 hover:bg-green-600 border-none text-white transition-all transform hover:scale-105"
                      onClick={() => router.push(`/patient/consultation/${appointment.id}`)}
                    >
                      <Video className="w-5 h-5 mr-3 text-white" />
                      Direct Join (Demo)
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

        {/* Available Doctors */}
        <Card className="mb-8 border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6">
            <CardTitle className="text-lg font-bold">हमारे डॉक्टर (Available Doctors)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="px-4 h-9 text-xs font-bold"
              onClick={() => router.push('/patient/appointments/book')}
            >
              See All
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <Card key={doctor._id || doctor.id} className="group cursor-pointer border shadow-none overflow-hidden" onClick={() => router.push(`/patient/appointments/book`)}>
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                      <Avatar className="w-16 h-16 border-2 transition-transform group-hover:scale-105">
                        <AvatarImage src={doctor.avatar} />
                        <AvatarFallback className="bg-primary/5">
                          <Stethoscope className="h-8 w-8 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-base text-foreground">{doctor.name}</h3>
                        <p className="text-xs text-primary font-bold uppercase tracking-wide">{doctor.specialization}</p>
                      </div>
                      <div className="flex items-center justify-center gap-2 w-full py-2 bg-muted rounded-xl">
                        <span className="text-sm font-bold text-foreground">₹{doctor.consultationFee}</span>
                        <span className="w-1 h-1 bg-muted-foreground/20 rounded-full"></span>
                        <span className="text-[10px] font-bold text-muted-foreground">{doctor.experience}Y EXP</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-slate-400 font-bold text-xl">
                  डॉक्टर अभी उपलब्ध नहीं हैं (No doctors found)
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Health Tips & Emergency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-none border-red-500/20 bg-red-500/5 relative overflow-hidden">
            <CardHeader className="py-4 px-6">
              <CardTitle className="flex items-center text-lg font-bold text-red-500">
                <AlertCircle className="w-5 h-5 mr-3" />
                आपातकालीन (Emergency)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <p className="text-sm text-muted-foreground font-medium">Any health emergency? Call our 24/7 medical support team immediately.</p>
              <Button
                variant="destructive"
                className="w-full h-11 text-lg font-black rounded-xl bg-red-600 hover:bg-red-700 transition-all font-bold"
              >
                <Phone className="w-5 h-5 mr-3 animate-pulse" />
                Call HELP: 102
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-none border-green-500/20 bg-green-500/5">
            <CardHeader className="py-4 px-6">
              <CardTitle className="flex items-center text-lg font-bold text-green-500">
                <Heart className="w-5 h-5 mr-3" />
                स्वास्थ्य सलाह (Health Tips)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-3">
              <div className="p-3 bg-background/50 rounded-xl flex items-center gap-4 border">
                <span className="text-2xl shrink-0">💧</span>
                <div>
                  <p className="text-sm font-bold text-foreground">पानी पीते रहें (Stay Hydrated)</p>
                  <p className="text-xs text-muted-foreground">Drink 8 glasses of water daily</p>
                </div>
              </div>
              <div className="p-3 bg-background/50 rounded-xl flex items-center gap-4 border">
                <span className="text-2xl shrink-0">😴</span>
                <div>
                  <p className="text-sm font-bold text-foreground">पूरी नींद लें (Good Sleep)</p>
                  <p className="text-xs text-muted-foreground">Aim for 7-8 hours of sleep</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Files', sub: 'Reports', icon: FileText, color: 'bg-primary/10 text-primary', path: '/patient/records' },
            { label: 'Doctors', sub: 'Book Now', icon: Stethoscope, iconColor: 'text-secondary', color: 'bg-secondary/10', path: '/patient/appointments/book' },
            { label: 'Profile', sub: 'Edit Info', icon: User, color: 'bg-orange-500/10 text-orange-500', path: '/patient/profile' },
            { label: 'Medicines', sub: 'Track', icon: Pill, color: 'bg-green-500/10 text-green-500', path: '/patient/medicine-tracker' },
          ].map((action, i) => (
            <Card key={i} className="group cursor-pointer border shadow-none hover:bg-muted/30 transition-colors" onClick={() => router.push(action.path)}>
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", action.color)}>
                  <action.icon className={cn("w-6 h-6", (action as any).iconColor)} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{action.label}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{action.sub}</p>
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
      < nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t h-16 z-50" >
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
              onClick={() => router.push('/patient/appointments')}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-[10px] font-bold">Dates</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1 px-2"
              onClick={() => router.push('/patient/records')}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] font-bold">Files</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1 px-2"
              onClick={() => router.push('/patient/profile')}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-bold">Me</span>
            </Button>
          </div>
        </div>
      </nav >
    </div >
  );
}