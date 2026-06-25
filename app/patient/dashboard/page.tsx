'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/language-context';
import { MedicineTracker } from '@/components/medicine-tracker';
import { DhanvantariDrishti } from '@/components/dhanvantari-drishti';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { Button } from '@/components/ui/button';
import { BackendStatusPanel } from '@/components/backend-status-panel';
import { getSocket } from '@/lib/socket';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  Video,
  FileText,
  User,
  Home,
  CalendarDays,
  Stethoscope,
  Bell,
  Heart,
  AlertCircle,
  Plus,
  Clock,
  Phone,
  Pill,
  Loader2,
  Upload,
  MapPin
} from 'lucide-react';
import { cn, getApiUrl } from '@/lib/utils';

interface Appointment {
  id: string;
  patientId: string;
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
  const { language, t } = useLanguage();
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

  // Loading states for navigation buttons
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);
  const [activeConsultationLoading, setActiveConsultationLoading] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);

  // Upload Record states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMedicationLoading, setIsMedicationLoading] = useState(false);

  const fetchRecords = async () => {
    if (!user) return;
    try {
      const apiUrl = getApiUrl();
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

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadCategory || !uploadTitle) {
      toast.error('Please fill in all required fields / कृपया सभी आवश्यक फ़ील्ड भरें');
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        resolve(reader.result as string);
      });
      
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(selectedFile);
      });

      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user?.id,
          category: uploadCategory,
          title: uploadTitle,
          description: uploadDescription,
          fileName: selectedFile.name,
          fileBase64
        })
      });

      if (res.ok) {
        toast.success('Record uploaded successfully / रिकॉर्ड सफलतापूर्वक अपलोड किया गया');
        setIsUploadOpen(false);
        resetUploadForm();
        fetchRecords();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload record');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadCategory('');
    setUploadTitle('');
    setUploadDescription('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const findNearestHospital = () => {
    toast.info('Fetching your location... / आपकी स्थिति प्राप्त की जा रही है...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const url = `https://www.google.com/maps/search/?api=1&query=hospital&ll=${lat},${lon}`;
          window.open(url, '_blank');
        },
        (error) => {
          console.warn("Geolocation failed or denied, using fallback hospital search:", error);
          window.open('https://www.google.com/maps/search/?api=1&query=nearest+emergency+hospital', '_blank');
        }
      );
    } else {
      window.open('https://www.google.com/maps/search/?api=1&query=nearest+emergency+hospital', '_blank');
    }
  };

  useEffect(() => {
    if (!isLoaded || !user) return;

    if (user.unsafeMetadata?.role !== 'patient') {
      router.push('/');
      return;
    }

    // Pre-connect Socket.IO to eliminate latency when joining video rooms
    try {
      getSocket();
    } catch (err) {
      console.warn('Socket preconnection skipped:', err);
    }

    // Prefetch common routes for instant navigation transitions
    router.prefetch('/patient/appointments/book');
    router.prefetch('/patient/appointments');
    router.prefetch('/patient/records');
    router.prefetch('/patient/profile');
    router.prefetch('/patient/medicine-tracker');

    // Cache-First: Load from localStorage immediately for instant UI
    const localProfile = localStorage.getItem(`patient_profile_${user.id}`);
    const localApts = localStorage.getItem('appointments');
    
    if (localProfile) {
      setProfileData(JSON.parse(localProfile));
    }
    
    if (localApts) {
      const storedAppointments = JSON.parse(localApts).filter((apt: any) =>
        (apt.patientId === user.id || (apt.patient_id === user.id)) && apt.status !== 'pending_payment'
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

    // Fetch profile from Backend
    const fetchProfile = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/users/patient/${user.id}`);
        if (res.ok) {
          const remoteProfile = await res.json();
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
          localStorage.setItem(`patient_profile_${user.id}`, JSON.stringify(mappedProfile));
        } else {
          const storedProfile = localStorage.getItem(`patient_profile_${user.id}`);
          if (storedProfile) {
            setProfileData(JSON.parse(storedProfile));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        const storedProfile = localStorage.getItem(`patient_profile_${user.id}`);
        if (storedProfile) {
          setProfileData(JSON.parse(storedProfile));
        } else {
          setProfileData({
            fullName: user.fullName || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            userId: user.id
          } as any);
        }
      }
    };
    fetchProfile();

    // Load appointments from Backend
    const fetchAppointments = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/appointments/patient/${user.id}`);
        if (res.ok) {
          const remoteAppointments = await res.json();
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
            return d;
          };

          const today = new Date().toISOString().split('T')[0];
          const todayStr = normalizeDate(today);
          const upcoming = userAppointments.map((apt: any) => ({
            ...apt,
            status: 'confirmed'
          }));

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

          localStorage.setItem('appointments', JSON.stringify(userAppointments));
        } else {
          const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
          const userAppointments = storedAppointments.filter((apt: any) => 
            (apt.patient_id === user.id || apt.patientId === user.id) &&
            apt.status !== 'pending_payment'
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

    fetchRecords();

    // Fetch doctors
    const fetchDoctors = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/doctors`);
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.slice(0, 4));
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
    { label: 'Upcoming Visits / आने वाले अपॉइंटमेंट', value: statsData.upcomingCount, icon: Calendar, color: 'bg-primary/10 text-primary' },
    { label: 'Consultations / कुल परामर्श', value: statsData.totalConsultations, icon: Video, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Medical Records / चिकित्सा रिकॉर्ड', value: statsData.medicalRecords, icon: FileText, color: 'bg-indigo-500/10 text-indigo-600' },
    { label: 'Health Score / स्वास्थ्य स्कोर', value: statsData.healthScore, icon: Heart, color: 'bg-rose-500/10 text-rose-600' },
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
      <header className="bg-card border-b sticky top-0 z-50">
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
              {language === 'hindi' ? 'नमस्ते' : 'Hello'}, {user.firstName}
            </h2>
            <p className="text-base md:text-lg font-extrabold text-muted-foreground">{formattedDate}</p>
            <div className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-wider mt-4 border border-emerald-100">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Secure & Encrypted / सुरक्षित और गोपनीय
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
            {/* Book Doctor Button */}
            <Button
              onClick={() => {
                setIsBookingLoading(true);
                router.push('/patient/appointments/book');
              }}
              loading={isBookingLoading}
              variant="premium"
              className="h-14 md:h-16 px-8 rounded-2xl font-black shadow-md border-2 border-primary/10 text-primary flex items-center justify-center"
            >
              <Plus className="w-6 h-6 mr-2 shrink-0" />
              <div className="flex flex-col items-start leading-tight text-left">
                <span className="text-sm md:text-base font-extrabold text-[#001C3D]">Book Doctor</span>
                <span className="text-xs font-semibold text-[#001C3D]/70">डॉक्टर से मिलें</span>
              </div>
            </Button>

            {/* My Appointments Button */}
            <Button
              onClick={() => {
                setIsAppointmentsLoading(true);
                router.push('/patient/appointments');
              }}
              loading={isAppointmentsLoading}
              variant="outline"
              className="h-14 md:h-16 px-8 rounded-2xl border-2 border-primary/45 hover:bg-primary/5 transition-all text-primary font-black flex items-center justify-center"
            >
              <Calendar className="w-6 h-6 mr-2 shrink-0" />
              <div className="flex flex-col items-start leading-tight text-left">
                <span className="text-sm md:text-base font-extrabold">Appointments</span>
                <span className="text-xs font-semibold text-primary/70">मेरे अपॉइंटमेंट</span>
              </div>
            </Button>

            {/* Upload Record Button */}
            <Button
              onClick={() => setIsUploadOpen(true)}
              variant="outline"
              className="h-14 md:h-16 px-8 rounded-2xl border-2 border-indigo-500/40 hover:bg-indigo-50/50 transition-all text-indigo-600 font-black flex items-center justify-center"
            >
              <Upload className="w-6 h-6 mr-2 shrink-0" />
              <div className="flex flex-col items-start leading-tight text-left">
                <span className="text-sm md:text-base font-extrabold">Upload Record</span>
                <span className="text-xs font-semibold text-indigo-600/70">दस्तावेज़ अपलोड</span>
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

        {/* System Status Panel (Non-technical connectivity check) */}
        <div className="mb-10">
          <BackendStatusPanel />
        </div>

        {/* Profile Information */}
        {profileData && (
          <Card className="mb-8 border shadow-sm rounded-3xl">
            <CardHeader className="border-b py-5 px-6">
              <CardTitle className="flex items-center text-xl font-bold">
                <User className="w-6 h-6 mr-3 text-primary" />
                My Profile / मेरी जानकारी
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-primary uppercase tracking-wider border-l-3 border-primary pl-3">
                    Personal Info / व्यक्तिगत जानकारी
                  </h4>
                  <div className="grid gap-4">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Full Name / पूरा नाम</p>
                      <p className="text-lg font-bold text-foreground">{profileData.fullName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Phone / फ़ोन</p>
                        <p className="text-base font-bold text-foreground">{profileData.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Gender / लिंग</p>
                        <p className="text-base font-bold text-foreground capitalize">{profileData.gender}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Address / पता</p>
                      <p className="text-base font-semibold text-foreground">{profileData.address || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-secondary uppercase tracking-wider border-l-3 border-secondary pl-3">
                    Medical Info / स्वास्थ्य जानकारी
                  </h4>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-muted rounded-xl text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Blood / रक्त</p>
                        <p className="text-lg font-bold text-red-500">{profileData.bloodGroup || '-'}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-xl text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Height / लंबाई</p>
                        <p className="text-base font-bold text-blue-500">{profileData.height || '-'} cm</p>
                      </div>
                      <div className="p-3 bg-muted rounded-xl text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Weight / वजन</p>
                        <p className="text-base font-bold text-green-500">{profileData.weight || '-'} kg</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Allergies / एलर्जी</p>
                      <p className="text-base font-semibold text-red-400">{profileData.allergies || 'None / कोई नहीं'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Current Medications / अभी चल रही दवाइयाँ</p>
                      <p className="text-base font-semibold text-foreground">{profileData.currentMedications || 'None / कोई नहीं'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Appointments */}
        <Card className="mb-12 shadow-[0_30px_60px_rgba(0,0,0,0.04)] overflow-hidden border-border rounded-[2.5rem]">
          <CardHeader className="flex flex-row items-center justify-between py-8 bg-primary/5 px-10 border-b border-border">
            <CardTitle className="text-2xl font-black text-foreground tracking-tight uppercase">
              {t('upcoming_visits')}
            </CardTitle>
            <Button
              variant="outline"
              size="default"
              className="px-6 h-12 text-sm font-black border-2 rounded-xl"
              onClick={() => {
                setIsAppointmentsLoading(true);
                router.push('/patient/appointments');
              }}
              loading={isAppointmentsLoading}
            >
              See All / सभी देखें
            </Button>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col md:flex-row items-center justify-between p-6 border border-border rounded-[2rem] bg-card gap-6 hover:border-primary/30 hover:shadow-xl transition-all group">
                <div className="flex items-center space-x-6 w-full md:w-auto">
                  <div className="relative shrink-0">
                    <Avatar className="w-20 h-20 border-2 border-border p-1">
                      <AvatarImage src={appointment.avatar} className="rounded-2xl" />
                      <AvatarFallback className="bg-muted text-primary text-xl font-black rounded-2xl">
                        {appointment.doctorName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-white">
                      <Video className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-foreground tracking-tight">{appointment.doctorName}</p>
                    <p className="text-sm font-bold text-primary uppercase tracking-wider">{appointment.doctorSpecialization}</p>
                    <div className="flex flex-wrap items-center text-xs text-muted-foreground font-bold uppercase tracking-wider mt-2 gap-x-4">
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{appointment.date === 'hackathon' ? 'Demo Room' : new Date(appointment.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{appointment.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0">
                  <Badge
                    className={cn("h-10 px-4 text-xs font-black rounded-xl uppercase tracking-wider bg-emerald-50 text-emerald-600 border-transparent")}
                    variant="outline"
                  >
                    Ready / तैयार
                  </Badge>
                  <Button
                    variant="premium"
                    className="h-14 px-8 text-sm font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto"
                    onClick={() => {
                      setActiveConsultationLoading(appointment.id);
                      router.push(`/patient/consultation/${appointment.id}`);
                    }}
                    loading={activeConsultationLoading === appointment.id}
                  >
                    <Video className="w-5 h-5 mr-2 shrink-0" />
                    <div className="flex flex-col items-start leading-tight text-left">
                      <span className="text-sm font-extrabold text-[#001C3D]">Join Call</span>
                      <span className="text-xs font-semibold text-[#001C3D]/70">कॉल में शामिल हों</span>
                    </div>
                  </Button>
                </div>
              </div>
            ))}

            {upcomingAppointments.length === 0 && (
              <div className="text-center py-16 space-y-8">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-12 h-12 text-muted-foreground/60" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-extrabold text-foreground">No Appointments / कोई मुलाक़ात नहीं</p>
                </div>
                <Button
                  onClick={() => {
                    setIsBookingLoading(true);
                    router.push('/patient/appointments/book');
                  }}
                  loading={isBookingLoading}
                  size="lg"
                  className="h-16 px-10 text-lg bg-primary text-white hover:bg-primary/95 rounded-2xl shadow-lg shadow-primary/20"
                >
                  <Plus className="w-6 h-6 mr-3" />
                  Book Doctor / अभी बुक करें
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Past Appointments */}
        {pastAppointments.length > 0 && (
          <Card className="mb-12 shadow-[0_30px_60px_rgba(0,0,0,0.04)] overflow-hidden border-border rounded-[2.5rem]">
            <CardHeader className="flex flex-row items-center justify-between py-6 bg-primary/5 px-10 border-b border-border">
              <CardTitle className="text-xl font-black text-foreground tracking-tight uppercase">
                {t('recent_visits')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {pastAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-5 border border-border/50 rounded-[1.5rem] bg-card gap-4 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12 border p-0.5">
                      <AvatarImage src={appointment.avatar} />
                      <AvatarFallback className="bg-muted text-primary text-sm font-bold">
                        {appointment.doctorName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-foreground text-base">{appointment.doctorName}</p>
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

        {/* Available Doctors */}
        <Card className="mb-12 border border-border shadow-[0_20px_40px_rgba(0,0,0,0.03)] bg-card rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-6 px-10 border-b border-border/50">
            <CardTitle className="text-xl font-black text-foreground uppercase tracking-tight">
              {t('available_doctors')}
            </CardTitle>
            <Button
              variant="outline"
              size="default"
              className="px-6 h-12 text-sm font-black rounded-xl border-border"
              onClick={() => {
                setIsBookingLoading(true);
                router.push('/patient/appointments/book');
              }}
              loading={isBookingLoading}
            >
              See All / सभी देखें
            </Button>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <Card 
                    key={doctor._id || doctor.id} 
                    className="group cursor-pointer border border-border shadow-none overflow-hidden hover:border-primary/20 hover:shadow-xl transition-all rounded-[2rem] bg-muted/30" 
                    onClick={() => {
                      setIsBookingLoading(true);
                      router.push(`/patient/appointments/book`);
                    }}
                  >
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                      <Avatar className="w-20 h-20 border-2 border-card transition-transform group-hover:scale-105 shadow-md">
                        <AvatarImage src={doctor.avatar} />
                        <AvatarFallback className="bg-card">
                          <Stethoscope className="h-10 w-10 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="font-black text-base text-foreground tracking-tight">{doctor.name}</h3>
                        <p className="text-xs text-primary font-black uppercase tracking-wider">{doctor.specialization}</p>
                      </div>
                      <div className="flex items-center justify-center gap-3 w-full py-2 bg-card rounded-xl border border-border shadow-sm">
                        <span className="text-sm font-black text-foreground">₹{doctor.consultationFee}</span>
                        <span className="w-1.5 h-1.5 bg-border rounded-full"></span>
                        <span className="text-xs font-bold text-muted-foreground">{doctor.experience} Y EXP</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground font-bold text-lg">
                  No Doctors Available / कोई डॉक्टर उपलब्ध नहीं हैं
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Health Tips & Emergency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-xl shadow-rose-100/50 border-rose-100 bg-rose-50 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform" />
            <CardHeader className="py-6 px-10">
              <CardTitle className="flex items-center text-2xl font-black text-rose-600 tracking-tight uppercase">
                <AlertCircle className="w-8 h-8 mr-4" />
                Emergency Support / आपातकालीन सहायता
              </CardTitle>
            </CardHeader>
            <CardContent className="px-10 pb-8 space-y-6 relative z-10">
              <p className="text-sm text-rose-900/60 font-semibold">{t('emergency_desc')}</p>
              <Button
                variant="destructive"
                className="w-full h-16 text-lg font-black rounded-2xl bg-rose-600 hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 flex items-center justify-center"
                onClick={() => window.open('tel:102')}
              >
                <Phone className="w-6 h-6 mr-4 animate-pulse text-white" />
                CALL / कॉल करें: 102
              </Button>

              <Button
                variant="outline"
                className="w-full h-16 text-base md:text-lg font-black rounded-2xl border-2 border-rose-200 text-rose-600 hover:bg-rose-100/50 bg-white transition-all shadow-md flex items-center justify-center mt-3"
                onClick={findNearestHospital}
              >
                <MapPin className="w-6 h-6 mr-4 text-rose-600" />
                NEAREST HOSPITAL / नजदीकी अस्पताल खोजें
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl shadow-emerald-100/50 border-emerald-100 bg-emerald-50 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform" />
            <CardHeader className="py-6 px-10">
              <CardTitle className="flex items-center text-2xl font-black text-emerald-600 tracking-tight uppercase">
                <Heart className="w-8 h-8 mr-4" />
                Health Tips / स्वास्थ्य सलाह
              </CardTitle>
            </CardHeader>
            <CardContent className="px-10 pb-8 space-y-4 relative z-10">
              <div className="p-4 bg-card/70 backdrop-blur-sm rounded-[1.5rem] flex items-center gap-4 border border-card">
                <span className="text-3xl shrink-0">💧</span>
                <div>
                  <p className="text-sm font-black text-foreground">Stay Hydrated / पानी पीते रहें</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Drink plenty of water throughout the day. / दिनभर पर्याप्त मात्रा में पानी पिएं।</p>
                </div>
              </div>
              <div className="p-4 bg-card/70 backdrop-blur-sm rounded-[1.5rem] flex items-center gap-4 border border-card">
                <span className="text-3xl shrink-0">😴</span>
                <div>
                  <p className="text-sm font-black text-foreground">Good Sleep / पूरी नींद लें</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Get 7-8 hours of restful sleep daily. / नियमित रूप से ७-८ घंटे की नींद लें।</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Medical Records / चिकित्सा रिकॉर्ड', icon: FileText, color: 'bg-indigo-50 text-indigo-600', path: '/patient/records', loadingSetter: setIsRecordsLoading, loadingVal: isRecordsLoading },
            { label: 'Book Doctor / डॉक्टर से मिलें', icon: Stethoscope, color: 'bg-primary/10 text-primary', path: '/patient/appointments/book', loadingSetter: setIsBookingLoading, loadingVal: isBookingLoading },
            { label: 'My Profile / मेरी जानकारी', icon: User, color: 'bg-amber-50 text-amber-600', path: '/patient/profile', loadingSetter: setIsProfileLoading, loadingVal: isProfileLoading },
            { label: 'Medicines / दवाई समय', icon: Pill, color: 'bg-emerald-50 text-emerald-600', path: '/patient/medicine-tracker', loadingSetter: setIsMedicationLoading, loadingVal: isMedicationLoading },
          ].map((action, i) => (
            <Card 
              key={i} 
              className="group cursor-pointer border border-border shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-150 rounded-[2rem] bg-card overflow-hidden" 
              onClick={() => {
                action.loadingSetter(true);
                router.push(action.path);
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className={cn("relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all group-hover:scale-110", action.color)}>
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

        {/* Dhanvantari Drishti Section */}
        <div className="mb-8">
          <DhanvantariDrishti />
        </div>

        {/* Medicine Tracker Section */}
        <Card className="mb-8 border shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="py-4 px-6 border-b bg-primary/5">
            <CardTitle className="flex items-center text-lg font-black">
              <Pill className="w-5 h-5 mr-3 text-primary" />
              Medicine Tracker / दवाई ट्रैकर
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <MedicineTracker />
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-2xl border-t border-border h-20 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto px-10 h-full max-w-5xl">
          <div className="flex justify-around items-center h-full">
            <Link href="/patient/dashboard" className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-primary gap-1 px-4 rounded-none hover:bg-transparent active:bg-transparent focus:bg-transparent transition-colors duration-150"
              >
                <Home className="w-6 h-6" />
                <span className="text-xs font-extrabold uppercase tracking-wide">Home / मुख्य</span>
              </Button>
            </Link>
            <Link href="/patient/appointments" className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-muted-foreground gap-1 px-4 rounded-none hover:text-primary hover:bg-transparent active:bg-transparent focus:bg-transparent transition-colors duration-150"
              >
                <CalendarDays className="w-6 h-6" />
                <span className="text-xs font-extrabold uppercase tracking-wide">Appointments / मुलाक़ात</span>
              </Button>
            </Link>
            <Link href="/patient/records" className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-muted-foreground gap-1 px-4 rounded-none hover:text-primary hover:bg-transparent active:bg-transparent focus:bg-transparent transition-colors duration-150"
              >
                <FileText className="w-6 h-6" />
                <span className="text-xs font-extrabold uppercase tracking-wide">Records / रिकॉर्ड</span>
              </Button>
            </Link>
            <Link href="/patient/profile" className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-full w-full text-muted-foreground gap-1 px-4 hover:text-primary hover:bg-transparent focus:bg-transparent active:bg-transparent transition-colors duration-150 rounded-none"
              >
                <User className="w-6 h-6" />
                <span className="text-xs font-extrabold uppercase tracking-wide">Profile / प्रोफ़ाइल</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md bg-card border-border rounded-3xl overflow-hidden shadow-2xl">
          <DialogHeader className="py-4 px-6 border-b">
            <DialogTitle className="text-xl font-bold flex items-center text-foreground">
              <Upload className="w-5 h-5 mr-3 text-primary" />
              Upload Medical Record / रिकॉर्ड अपलोड करें
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Add reports, prescriptions, or lab results.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFileUpload} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="category" className="font-extrabold text-sm text-foreground">
                Category / श्रेणी <span className="text-destructive">*</span>
              </Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="rounded-xl h-11 border-border bg-background">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-xl">
                  <SelectItem value="visits">Doctor Visit / डॉक्टर पर्ची</SelectItem>
                  <SelectItem value="labs">Lab Report / लैब रिपोर्ट</SelectItem>
                  <SelectItem value="meds">Prescriptions / दवाई सूची</SelectItem>
                  <SelectItem value="vax">Vaccines / टीका रिकॉर्ड</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="font-extrabold text-sm text-foreground">
                Document Title / शीर्षक <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g., Blood Test, Allergy Report"
                className="rounded-xl h-11 border-border bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-extrabold text-sm text-foreground">
                Short Notes / संक्षिप्त विवरण
              </Label>
              <Textarea
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Optional description..."
                className="rounded-xl border-border min-h-[80px] bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-extrabold text-sm text-foreground">
                Choose File / फ़ाइल चुनें <span className="text-destructive">*</span>
              </Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/55 rounded-2xl p-6 text-center cursor-pointer hover:bg-primary/5 transition-all bg-background"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
                />
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                {selectedFile ? (
                  <p className="text-sm font-bold text-foreground truncate max-w-xs mx-auto">
                    {selectedFile.name}
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-bold text-foreground">Click to upload document</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, TXT, or Image up to 10MB</p>
                  </>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t flex gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => {
                  setIsUploadOpen(false);
                  resetUploadForm();
                }} 
                className="rounded-xl font-bold flex-1 h-12"
              >
                Cancel / रद्द करें
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading}
                className="rounded-xl font-bold flex-1 h-12"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Upload / अपलोड'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ChatWidget />
    </div>
  );
}
