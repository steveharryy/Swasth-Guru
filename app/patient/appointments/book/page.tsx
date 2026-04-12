'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/language-context';
import { useNotification } from '@/contexts/notification-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  ArrowLeft,
  Search,
  Stethoscope,
  Star,
  Clock,
  Video,
  Phone,
  Calendar,
  User,
  MapPin,
  Languages,
  IndianRupee,
  CheckCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  Activity,
  Heart,
  Thermometer,
  Stethoscope as StethoscopeIcon,
  Search as SearchIcon,
  Plus
} from 'lucide-react';
import { doctorsData, getAvailableDoctors, getDoctorAvatar, type Doctor } from '@/lib/doctors-data';
import { VoiceSymptomLogger } from '@/components/VoiceSymptomLogger';

import { MEDICAL_SPECIALIZATIONS } from '@/lib/specializations';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface BookingStep {
  step: number;
  title: string;
}

const bookingSteps: BookingStep[] = [
  { step: 1, title: 'Select Symptoms' },
  { step: 2, title: 'Choose Doctor' },
  { step: 3, title: 'Select Date & Time' },
  { step: 4, title: 'Confirm Booking' }
];

interface Symptom {
  name: string;
  image: string;
  category: string;
}

const SYMPTOM_CATEGORIES = [
  { id: 'general', name: 'General & Pain', icon: Activity },
  { id: 'respiratory', name: 'Respiratory', icon: Thermometer },
  { id: 'digestive', name: 'Digestive', icon: Activity },
  { id: 'chronic', name: 'Chronic & Heart', icon: Heart },
  { id: 'specialized', name: 'Special Care', icon: StethoscopeIcon },
  { id: 'mental', name: 'Mental Health', icon: Brain },
];

function Brain(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z" /></svg>
}

const categorizedSymptoms: Symptom[] = [
  // Primary (Requested Order)
  { name: 'Chickenpox', category: 'general', image: 'https://regencyhealthcare.in/wp-content/uploads/2018/06/blog2-1-1200x800.png' },
  { name: 'Constipation', category: 'general', image: 'https://livhospital.b-cdn.net/wp-content/uploads/2025/11/26235545/image-6807-1049-1024x683.png' },
  { name: 'Body ache', category: 'general', image: 'https://connect.healthkart.com/wp-content/uploads/2023/04/Body-ache-how-to-overcome-this-problem-_900.jpg' },
  { name: 'Nausea', category: 'general', image: '/symptoms/nausea.png' },
  { name: 'Chest Problems', category: 'general', image: 'https://www.eroftexas.com/when-to-go-to-the-er-for-heart-problems/images/when-to-go-to-the-er-for-heart-problems.jpg' },

  // General & Pain (Remaining)
  { name: 'Adult Fever', category: 'general', image: 'https://amoryurgentcare.com/wp-content/uploads/2019/12/how-to-tell-if-you-have-a-fever.jpeg' },
  { name: 'Headache', category: 'general', image: 'https://www.sapnamed.com/wp-content/uploads/2021/03/difference-between-headaches-and-migraines-1200x800.jpg' },
  { name: 'Joint pain', category: 'general', image: 'https://www.sparshhospital.com/wp-content/uploads/2024/10/join-img1.jpg' },
  { name: 'Back pain', category: 'general', image: 'https://atlantabrainandspine.com/wp-content/uploads/2024/08/iStock-1397841645.jpg' },
  { name: 'Fatigue', category: 'general', image: 'https://www.bestmed.co.za/-/media/article-images/nov-2022/best-life-nov-22/article-1_1083.png?h=555&iar=0&w=1083&hash=161C9BF3776F752CC71DB348708D793B' },

  // Respiratory
  { name: 'Cough', category: 'respiratory', image: 'https://www.eroftexas.com/when-your-cough-is-serious/images/when-your-cough-is-serious.jpg' },
  { name: 'Sore throat', category: 'respiratory', image: 'https://urgentcaresouthaven.com/wp-content/uploads/2018/04/Persistent-Sore-Throat.jpeg' },
  { name: 'Runny nose', category: 'respiratory', image: 'https://curistrelief.com/cdn/shop/articles/Curist_Blog_-_Runny_Nose_-_Covid_Flu_Allergies_Cold_-_compressed_a0c37832-9a6c-42eb-9468-79ec9b8c7013_600x.jpg?v=1743395492' },
  { name: 'Shortness of breath', category: 'respiratory', image: 'https://sa1s3optim.patientpop.com/assets/images/provider/photos/2312977.jpeg' },

  // Digestive (Remaining)
  { name: 'Stomach pain', category: 'digestive', image: 'https://sydneygutclinic.com/wp-content/uploads/2024/11/Untitled-design-67.jpg' },
  { name: 'Diarrhea', category: 'digestive', image: 'https://livhospital.b-cdn.net/wp-content/uploads/2025/11/26235545/image-6807-1049-1024x683.png' },

  // Chronic & Metabolic (Remaining)
  { name: 'High blood pressure', category: 'chronic', image: 'https://www.uclahealth.org/sites/default/files/styles/landscape_16x9_030000_1200x675/public/images/81/woman-with-high-blood-pressure-istock-1296154975-3.jpg?h=3bba9472&f=42b0fc66&itok=ompgtM1L' },
  { name: 'Diabetes', category: 'chronic', image: 'https://cdn.scope.digital/Images/Articles/diyabet-nedir-seker-hastaligi-belirtileri-nelerdir-6792354.jpg?tr=w-630,h-420' },
  { name: 'Heart problems', category: 'chronic', image: 'https://www.eroftexas.com/when-to-go-to-the-er-for-heart-problems/images/when-to-go-to-the-er-for-heart-problems.jpg' },

  // Specialized Care (Remaining)
  { name: 'Skin rash', category: 'specialized', image: 'https://images.medicinenet.com/images/article/main_image/contact-dermatitis-rash-itch.jpg?output-quality=75' },
  { name: 'Eye problems', category: 'specialized', image: 'https://dam.northwell.edu/m/2a681b77904999b7/Drupal-TheWell_common-eye-problems_AS_33645131.jpg' },
  { name: 'Dental pain', category: 'specialized', image: 'https://images.unsplash.com/photo-1588773928163-f942f360707c?auto=format&fit=crop&q=80&w=400' },
  { name: 'Pregnancy care', category: 'specialized', image: 'https://gruhahealthcare.com/wp-content/uploads/2024/01/pregnancy-care-1024x536.jpeg' },
  { name: 'Child fever', category: 'specialized', image: 'https://commonwealthpeds.com/wp-content/uploads/2025/05/ComPed-How-to-Tell-If-Child-Fever-is-Serious-or-Just-a-Cold-Blog.png' },
  { name: 'Vaccination', category: 'specialized', image: 'https://regencyhealthcare.in/wp-content/uploads/2018/06/blog2-1-1200x800.png' },

  // Mental Health
  { name: 'Anxiety', category: 'mental', image: 'https://images.unsplash.com/photo-1474418397713-7ede21cc6611?auto=format&fit=crop&q=80&w=400' },
  { name: 'Depression', category: 'mental', image: 'https://domf5oio6qrcr.cloudfront.net/medialibrary/7813/a83db567-4c93-4ad0-af6f-72b57af7675d.jpg' },
  { name: 'Sleep problems', category: 'mental', image: 'https://eips.com/wp-content/uploads/2025/04/man-lying-bed-trying-sleep-cant-sleep-insomnia-sleeping-problems-sleep-disorders-1.jpg' },
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const { language, t } = useLanguage();
  const { showNotification } = useNotification();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState<'video' | 'phone'>('video');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'hi-IN'>('en-US');
  const [showVoiceInput, setShowVoiceInput] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string>('general');

  useEffect(() => {
    if (isLoaded && (!isAuthenticated || isDoctor)) {
      router.push('/');
    }
  }, [isAuthenticated, isDoctor, isLoaded, router]);

  useEffect(() => {
    if (currentStep === 2) {
      const fetchDoctors = async () => {
        setIsLoading(true);
        try {
          const doctors = await getAvailableDoctors(language, selectedSymptoms);
          setAvailableDoctors(doctors);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDoctors();
    }
  }, [currentStep, language, selectedSymptoms]);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms(prev => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setCurrentStep(3);
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentStep(4);
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !user || isSubmitting) return;

    setIsSubmitting(true);
    const appointmentId = Date.now().toString();
    const appointment = {
      id: appointmentId,
      patientId: user.id,
      patientName: user.fullName || 'Unknown',
      patientPhone: user.primaryPhoneNumber?.phoneNumber || 'Unknown',
      doctorId: selectedDoctor.clerkId || selectedDoctor.id.toString(),
      doctorName: selectedDoctor.name,
      doctorSpecialization: selectedDoctor.specialization,
      date: selectedDate,
      time: selectedTime,
      type: consultationType,
      status: 'pending_payment' as const,
      symptoms: selectedSymptoms,
      consultationFee: selectedDoctor.consultationFee,
      additionalNotes,
      avatar: selectedDoctor.avatar,
      createdAt: new Date().toISOString(),
      paymentStatus: 'pending' as const
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
      const response = await fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment),
      });

      const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      existingAppointments.push(appointment);
      localStorage.setItem('appointments', JSON.stringify(existingAppointments));

      router.push(`/patient/payment/${appointmentId}`);
    } catch (error) {
      console.error("Error syncing appointment:", error);
      showNotification("Failed to book appointment. Please try again.", "error");
      setIsSubmitting(false);
    }
  };

  const filteredDoctors = availableDoctors.filter(doctor =>
    (selectedSpecialization === '' || doctor.specialization === selectedSpecialization) &&
    (searchQuery === '' ||
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  if (!isLoaded || !isAuthenticated || isDoctor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100">

        <div className="container mx-auto px-6 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-2xl bg-white/5 text-white hover:bg-white/10 border border-white/5 transition-all"
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push('/patient/dashboard')}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <h1 className="text-3xl font-black logo-text tracking-tighter">Booking Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Node Address</p>
                <p className="text-xs font-bold font-mono text-primary">SWG-PATH-242</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary animate-pulse" />
              </div>

            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-32 pb-40 max-w-6xl">
        {/* Progress Stepper */}
        <div className="mb-20">
          <div className="flex items-center justify-between relative px-2 max-w-3xl mx-auto">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 -translate-y-1/2 z-0"></div>
            {bookingSteps.map((step) => (
              <div key={step.step} className="relative z-10 flex flex-col items-center">
                <motion.div
                  animate={{
                    scale: currentStep === step.step ? 1.2 : 1,
                    backgroundColor: currentStep >= step.step ? 'hsl(var(--primary))' : 'rgba(0,0,0,0.05)'
                  }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black transition-all border ${currentStep >= step.step ? 'border-primary shadow-2xl shadow-primary/20' : 'border-slate-200 text-slate-300'}`}>
                  {currentStep > step.step ? <CheckCircle className="w-6 h-6 text-white" /> : <span className={currentStep >= step.step ? 'text-white' : ''}>{step.step}</span>}
                </motion.div>
                <span className={`mt-4 text-[10px] font-black uppercase tracking-[0.4em] ${currentStep >= step.step ? 'text-primary' : 'text-slate-300'}`}>
                  {step.title.split(' ')[0]}
                </span>

              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && (
          <div className="space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Symptom Selection</h2>
              <p className="text-lg font-medium text-slate-500">Select the neurological or physical flags reported by your core.</p>
            </div>


            {/* Category Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {SYMPTOM_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 flex items-center gap-3 border",
                    activeCategory === cat.id
                      ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 scale-105"
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"
                  )}
                >

                  <cat.icon className="w-4 h-4" />
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Symptom Grid */}
            <div className="vibrant-card p-10 backdrop-blur-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {categorizedSymptoms.filter(s => s.category === activeCategory).map((symptom, idx) => (
                    <motion.div
                      key={symptom.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleSymptomToggle(symptom.name)}
                      className={cn(
                        "group cursor-pointer rounded-[2rem] overflow-hidden border-2 transition-all duration-700 relative aspect-[4/5]",
                        selectedSymptoms.includes(symptom.name)
                          ? "border-primary bg-primary/10 shadow-[0_0_40px_rgba(139,92,246,0.3)]"
                          : "border-white/5 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <div className="absolute inset-0 z-0">
                        <Image
                          src={symptom.image}
                          alt={symptom.name}
                          fill
                          className={cn(
                            "object-cover transition-transform duration-1000 group-hover:scale-110",
                            selectedSymptoms.includes(symptom.name) ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                          )}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      </div>
                      <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                          selectedSymptoms.includes(symptom.name) ? "bg-primary text-white scale-110" : "bg-white/20 text-white"
                        )}>
                          <Plus className={cn("w-6 h-6 transition-transform duration-500", selectedSymptoms.includes(symptom.name) && "rotate-45")} />
                        </div>
                        <h4 className="mt-4 text-xl font-black text-white tracking-tight">{symptom.name}</h4>
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mt-1">Detected ID: REF-{idx}</p>
                      </div>

                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Selected Summary */}
              <div className="mt-16 pt-16 border-t border-white/5 space-y-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-3 text-center md:text-left">
                    <h3 className="text-2xl font-black text-slate-800">Active Flags</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{selectedSymptoms.length} Anomalies detected</p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-end gap-3 max-w-xl">
                    {selectedSymptoms.map(s => (
                      <Badge key={s} className="px-5 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] hover:bg-rose-500 hover:text-white transition-all cursor-pointer" onClick={() => handleSymptomToggle(s)}>
                        {s} ×
                      </Badge>
                    ))}
                    {selectedSymptoms.length === 0 && <span className="text-slate-300 font-bold italic">No symptoms selected...</span>}
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-slate-800 uppercase tracking-wider">Voice Diagnostics</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Hands-free symptom reporting</p>
                    </div>
                    <Button
                      onClick={() => setShowVoiceInput(!showVoiceInput)}
                      className={cn(
                        "px-6 py-2 rounded-xl font-black text-[10px] tracking-widest transition-all",
                        showVoiceInput ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      {showVoiceInput ? 'DISABLE VOICE' : 'ENABLE VOICE MODE'}
                    </Button>
                  </div>


                  <AnimatePresence>
                    {showVoiceInput && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-12"
                      >
                        <VoiceSymptomLogger
                          onSymptomDetected={(s) => {
                            setSelectedSymptoms(prev => prev.includes(s) ? prev : [...prev, s]);
                            if (!selectedSymptoms.includes(s)) {
                              showNotification(`Detected: ${s}`, 'success');
                            }
                          }}
                          availableSymptoms={categorizedSymptoms.map(s => s.name)}
                          currentLanguage={voiceLang}
                          onLanguageChange={setVoiceLang}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] ml-2">Custom Anomalies</label>
                      <div className="flex gap-4">
                        <Input
                          className="h-16 px-8 text-lg font-bold rounded-2xl bg-slate-50 border-slate-200 text-slate-900 focus:border-primary transition-all"
                          placeholder="Describe other issues..."
                          value={customSymptom}
                          onChange={(e) => setCustomSymptom(e.target.value)}
                        />
                        <Button onClick={handleAddCustomSymptom} disabled={!customSymptom.trim()} className="h-16 px-10 rounded-2xl bg-slate-100 text-slate-600 font-black hover:bg-primary hover:text-white transition-all">
                          ADD
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={selectedSymptoms.length === 0}
                      className="glowing-button h-24 text-3xl font-black rounded-[2.5rem] flex items-center justify-center group"
                    >
                      Proceed to Doctor Selection
                      <ChevronRight className="ml-4 w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-12">
            <div className="vibrant-card p-10 bg-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                <div className="space-y-2 text-center md:text-left">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Doctor Selection</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Choose your preferred healthcare professional</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <Input
                      placeholder="Search Registry..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-14 pl-12 pr-6 rounded-2xl bg-slate-50 border-slate-200 text-slate-900 font-bold min-w-[300px]"
                    />
                  </div>
                  <select
                    value={selectedSpecialization}
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                    className="h-14 px-6 rounded-2xl bg-slate-50 border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-widest outline-none transition-all hover:bg-slate-100"
                  >
                    <option value="">All Fields</option>
                    {MEDICAL_SPECIALIZATIONS.map((spec) => (
                      <option key={spec.id} value={spec.name} className="bg-white">{spec.name}</option>
                    ))}
                  </select>
                </div>
              </div>


              <div className="space-y-8">
                {isLoading ? (
                  <div className="py-40 text-center space-y-8">
                    <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] animate-pulse">Initializing Direct Path Search...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredDoctors.map((doctor) => (
                      <motion.div
                        key={doctor.id}
                        whileHover={{ y: -10 }}
                        className="p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-primary/40 transition-all duration-500 relative overflow-hidden group/doc"
                      >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/doc:opacity-10 transition-opacity">
                          <Stethoscope className="w-24 h-24 text-primary" />
                        </div>
                        <div className="flex items-center gap-8 relative z-10">
                          <div className="relative">
                            <Avatar className="w-24 h-24 rounded-3xl border-2 border-primary/20 p-1">
                              <AvatarImage src={getDoctorAvatar(doctor)} className="rounded-2xl object-cover" />
                              <AvatarFallback className="bg-slate-100 rounded-2xl text-2xl font-black">{doctor.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-primary text-white px-2 py-1 rounded-lg text-[10px] font-black">
                              {doctor.rating} ★
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{doctor.name}</h3>
                            <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1.5 rounded-xl uppercase tracking-widest text-[9px]">
                              {doctor.specialization}
                            </Badge>
                            <div className="flex items-center gap-4 pt-2">
                              <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-bold">Available Now</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-400">
                                <IndianRupee className="w-4 h-4" />
                                <span className="text-xs font-bold font-mono">₹{doctor.consultationFee}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="mt-8 text-sm font-medium text-slate-500 italic leading-relaxed line-clamp-2">“{doctor.about}”</p>

                        <Button
                          onClick={() => handleDoctorSelect(doctor)}
                          className="glowing-button w-full h-16 mt-10 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Connect to Specialist
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
                {filteredDoctors.length === 0 && !isLoading && (
                  <div className="py-20 text-center space-y-6">
                    <Activity className="w-20 h-20 text-white/5 mx-auto" />
                    <p className="text-xl font-black text-white/30">No Medical Nodes Identified</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && selectedDoctor && (
          <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-4xl font-black text-center text-slate-900 tracking-tighter">Scheduling Matrix</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1 space-y-8">
                <div className="vibrant-card p-8 bg-white">
                  <Avatar className="w-full aspect-square rounded-[2rem] border-2 border-primary/20 mb-6">
                    <AvatarImage src={getDoctorAvatar(selectedDoctor)} className="object-cover" />
                  </Avatar>
                  <h3 className="text-2xl font-black text-center text-slate-800">{selectedDoctor.name}</h3>
                  <p className="text-[10px] font-black text-primary uppercase text-center tracking-widest mt-2">{selectedDoctor.specialization}</p>
                </div>
                <div className="vibrant-card p-6 bg-white space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Consultation Fee</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black font-mono text-slate-900">₹{selectedDoctor.consultationFee}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-4 rounded-lg uppercase tracking-widest font-black text-[9px]">Verified Node</Badge>
                  </div>
                </div>
              </div>


              <div className="lg:col-span-2 space-y-10">
                <Card className="vibrant-card border border-slate-100 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                  <CardContent className="p-10 space-y-12">
                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] ml-2">Communication Protocol</label>
                      <div className="grid grid-cols-2 gap-6">
                        {[
                          { id: 'video', label: 'Video Call', sub: 'Video Session', icon: Video },
                          { id: 'phone', label: 'Audio Call', sub: 'Audio Session', icon: Phone }
                        ].map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setConsultationType(type.id as any)}
                            className={cn(
                              "p-8 rounded-[2rem] border-2 transition-all duration-700 flex flex-col items-center gap-4 text-center group",
                              consultationType === type.id
                                ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20"
                                : "bg-slate-50 text-slate-400 border-slate-100 hover:border-primary/40"
                            )}
                          >
                            <type.icon className={cn("w-10 h-10 transition-transform duration-500 group-hover:scale-110", consultationType === type.id ? "text-white" : "text-primary")} />
                            <div>
                              <p className="text-lg font-black tracking-tight">{type.label}</p>
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{type.sub}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>


                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] ml-2">Time-Window Allocation</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {getNextAvailableDates().map((date) => (
                          <button
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className={cn(
                              "p-4 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-1",
                              selectedDate === date
                                ? "bg-primary text-white border-primary shadow-xl"
                                : "bg-slate-50 text-slate-400 border-slate-100 hover:border-primary/40"
                            )}
                          >
                            <span className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">{new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                            <span className="text-lg font-black">{new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                          </button>
                        ))}
                      </div>


                      {selectedDate && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-6"
                        >
                          {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"].map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={cn(
                                "h-12 text-xs font-black rounded-xl border transition-all duration-500",
                                selectedTime === time
                                  ? "bg-primary text-white border-primary shadow-lg"
                                  : "bg-slate-50 text-slate-600 border-slate-100 hover:border-primary/40"
                              )}
                            >
                              {time}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleDateTimeSelect(selectedDate, selectedTime)}
                      disabled={!selectedDate || !selectedTime}
                      className="glowing-button w-full h-24 text-2xl font-black rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-4 group mt-10"
                    >
                      Review Session Allocation
                      <ArrowLeft className="w-8 h-8 rotate-180 group-hover:translate-x-2 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && selectedDoctor && (
          <div className="max-w-3xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Confirmation Logic</h2>
              <p className="text-lg font-medium text-slate-500">Finalizing your direct path with {selectedDoctor.name}.</p>
            </div>

            <div className="vibrant-card p-12 bg-white space-y-12 relative overflow-hidden border border-slate-100">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-emerald-500" />

              <div className="flex flex-col md:flex-row items-center gap-10 p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative">
                <Avatar className="w-32 h-32 rounded-[2rem] border-2 border-primary/20">
                  <AvatarImage src={getDoctorAvatar(selectedDoctor)} className="object-cover" />
                </Avatar>
                <div className="space-y-4 text-center md:text-left">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedDoctor.name}</h3>
                    <p className="text-sm font-black text-primary uppercase tracking-[0.4em]">{selectedDoctor.specialization}</p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 flex items-center gap-3">
                      <Video className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{consultationType} Node</span>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{selectedTime}</span>
                    </div>
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Session Date</p>
                    <p className="text-xl font-black text-slate-900">{selectedDate}</p>
                  </div>
                </div>
                <div className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center border border-emerald-200 text-emerald-600">
                    <IndianRupee className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Execution Fee</p>
                    <p className="text-xl font-black text-slate-900 font-mono">₹{selectedDoctor.consultationFee}</p>
                  </div>
                </div>
              </div>


              <Button
                onClick={handleBookAppointment}
                className="glowing-button w-full h-24 text-3xl font-black rounded-[2.5rem] shadow-3xl mt-4 flex items-center justify-center group"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-6">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span className="uppercase tracking-widest">Compiling Transaction...</span>
                  </div>
                ) : (
                  <>
                    Book Appointment
                    <Activity className="ml-4 w-10 h-10 group-hover:scale-125 transition-transform" />
                  </>
                )}
              </Button>

              <p className="text-center text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mt-8 animate-pulse">
                Node Handshake Initialized &bull; Secure Protocol Active
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 py-10 bg-gradient-to-t from-background to-transparent pointer-events-none">
        <div className="container mx-auto px-6 max-w-6xl flex justify-center">
          <div className="px-6 py-2 rounded-full bg-white border border-slate-100 shadow-xl pointer-events-auto">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
              SwasthGuru Ecosystem &bull; Core Ver 4.0.2
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
