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
  Loader2
} from 'lucide-react';
import { doctorsData, getAvailableDoctors, type Doctor } from '@/lib/doctors-data';
import { MEDICAL_SPECIALIZATIONS } from '@/lib/specializations';
import { cn } from '@/lib/utils';

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

const commonSymptoms = [
  'Fever', 'Cough', 'Headache', 'Body ache', 'Sore throat', 'Runny nose',
  'Stomach pain', 'Nausea', 'Diarrhea', 'Constipation', 'Chest pain',
  'Shortness of breath', 'Dizziness', 'Fatigue', 'Joint pain', 'Back pain',
  'Skin rash', 'Eye problems', 'Ear pain', 'ENT pain', 'Throat pain',
  'Dental pain', 'Anxiety', 'Depression', 'Sleep problems',
  'High blood pressure', 'Diabetes', 'Heart problems', 'Pregnancy care',
  'Child fever', 'Vaccination'
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
    if (!selectedDoctor || !selectedDate || !selectedTime || !user) return;

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
      status: 'confirmed' as const,
      symptoms: selectedSymptoms,
      consultationFee: selectedDoctor.consultationFee,
      additionalNotes,
      avatar: selectedDoctor.avatar,
      createdAt: new Date().toISOString(),
      paymentStatus: 'pending' as const
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointment),
      });

      if (!response.ok) {
        console.warn("Backend sync failed");
      }
    } catch (error) {
      console.error("Error syncing appointment with backend:", error);
    }

    const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    existingAppointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(existingAppointments));

    router.push(`/patient/payment/${appointmentId}`);
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push('/patient/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Book Appointment</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 z-0"></div>
            {bookingSteps.map((step) => (
              <div key={step.step} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all border-2 shadow-sm ${currentStep >= step.step
                  ? 'bg-primary border-background text-primary-foreground scale-110'
                  : 'bg-card border-muted text-muted-foreground'
                  }`}>
                  {currentStep > step.step ? <CheckCircle className="w-5 h-5" /> : step.step}
                </div>
                <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${currentStep >= step.step ? 'text-primary' : 'text-muted-foreground/50'
                  }`}>
                  {step.title.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && (
          <Card className="shadow-none border bg-card">
            <CardHeader className="py-6 px-6 border-b">
              <CardTitle className="text-xl font-bold">What symptoms do you have?</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Select one or more symptoms</p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {commonSymptoms.map((symptom) => (
                  <div
                    key={symptom}
                    className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedSymptoms.includes(symptom)
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    onClick={() => handleSymptomToggle(symptom)}
                  >
                    <Checkbox id={symptom} checked={selectedSymptoms.includes(symptom)} />
                    <label htmlFor={symptom} className="text-sm font-bold cursor-pointer">{symptom}</label>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t">
                <label className="text-xs font-bold text-muted-foreground uppercase">Other symptoms:</label>
                <div className="flex gap-2">
                  <Input
                    className="h-10 text-sm rounded-xl"
                    placeholder="Type symptom..."
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                  />
                  <Button variant="outline" className="h-10 px-4 rounded-xl font-bold" onClick={handleAddCustomSymptom} disabled={!customSymptom.trim()}>
                    Add
                  </Button>
                </div>
              </div>

              {selectedSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-2xl">
                  {selectedSymptoms.map((symptom) => (
                    <Badge key={symptom} className="h-8 px-3 text-xs font-bold rounded-lg cursor-pointer hover:bg-destructive hover:text-white transition-colors" onClick={() => handleSymptomToggle(symptom)}>
                      {symptom} ×
                    </Badge>
                  ))}
                </div>
              )}

              <Button onClick={() => setCurrentStep(2)} className="w-full h-12 text-sm font-bold rounded-xl shadow-lg mt-4" disabled={selectedSymptoms.length === 0}>
                Find Doctors
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <Card className="shadow-none border bg-card">
              <CardHeader className="p-6 border-b">
                <CardTitle className="text-lg font-bold">Select Doctor</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest pl-1">Specialization</label>
                    <select
                      value={selectedSpecialization}
                      onChange={(e) => setSelectedSpecialization(e.target.value)}
                      className="w-full h-10 px-3 text-sm font-bold border rounded-xl bg-background outline-none"
                    >
                      <option value="">All Specializations</option>
                      {MEDICAL_SPECIALIZATIONS.map((spec) => (
                        <option key={spec.id} value={spec.name}>{spec.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest pl-1">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Name or specialty..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-10 pl-10 text-sm font-bold rounded-xl" />
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {isLoading ? (
                <div className="p-20 text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                  <p className="text-sm font-bold text-muted-foreground uppercase">Finding Doctors...</p>
                </div>
              ) : (
                <>
                  {filteredDoctors.map((doctor) => (
                    <Card key={doctor.id} className="overflow-hidden border shadow-none hover:shadow-md transition-all bg-card">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                          <Avatar className="w-20 h-20 border-2 border-primary/10">
                            <AvatarImage src={doctor.avatar} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">{doctor.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-center sm:text-left space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h3 className="text-lg font-bold">{doctor.name}</h3>
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-500/10 font-bold px-2 py-0 text-[10px]">
                                    {doctor.specialization}
                                  </Badge>
                                  <div className="flex items-center text-orange-500 font-bold text-xs">
                                    <Star className="w-3.5 h-3.5 fill-current mr-1" /> {doctor.rating}
                                  </div>
                                </div>
                              </div>
                              <div className="hidden sm:block text-right">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Fee</p>
                                <p className="text-lg font-bold">₹{doctor.consultationFee}</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground italic line-clamp-2 mt-1">"{doctor.about}"</p>
                            <Button onClick={() => handleDoctorSelect(doctor)} className="w-full h-10 text-sm font-bold rounded-xl mt-4 bg-gradient-to-r from-primary to-[#81D4FA] text-white">
                              Select Doctor
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredDoctors.length === 0 && (
                    <div className="p-16 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
                      <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                      <p className="text-lg font-bold">No doctors found</p>
                      <Button variant="ghost" onClick={() => { setSelectedSymptoms([]); setSelectedSpecialization(''); setSearchQuery(''); }}>Reset Search</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && selectedDoctor && (
          <Card className="shadow-none border bg-card">
            <CardHeader className="py-6 px-6 border-b">
              <CardTitle className="text-xl font-bold">Schedule Your Visit</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Talk with {selectedDoctor.name}</p>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Call Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant={consultationType === 'video' ? 'default' : 'outline'} onClick={() => setConsultationType('video')} className={cn("h-16 rounded-xl flex flex-col gap-1", consultationType === 'video' && "ring-2 ring-primary/20")}>
                    <Video className="w-5 h-5" /> <span className="text-xs font-bold">Video Call</span>
                  </Button>
                  <Button variant={consultationType === 'phone' ? 'default' : 'outline'} onClick={() => setConsultationType('phone')} className={cn("h-16 rounded-xl flex flex-col gap-1", consultationType === 'phone' && "ring-2 ring-primary/20")}>
                    <Phone className="w-5 h-5" /> <span className="text-xs font-bold">Audio Call</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Date</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {getNextAvailableDates().map((date) => (
                    <Button key={date} variant={selectedDate === date ? 'default' : 'outline'} onClick={() => setSelectedDate(date)} className={cn("h-16 rounded-xl flex flex-col p-2", selectedDate === date && "ring-2 ring-primary/20 border-primary")}>
                      <span className="text-[9px] uppercase tracking-widest opacity-60">{new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                      <span className="text-base font-bold">{new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Time</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"].map((time) => (
                      <Button key={time} variant={selectedTime === time ? 'default' : 'outline'} onClick={() => setSelectedTime(time)} className={cn("h-10 text-xs font-bold rounded-xl", selectedTime === time && "ring-2 ring-primary/20")}>
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => handleDateTimeSelect(selectedDate, selectedTime)} className="w-full h-12 text-sm font-bold rounded-xl shadow-lg mt-4 bg-gradient-to-r from-primary to-[#81D4FA] text-white" disabled={!selectedDate || !selectedTime}>
                Review Booking
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && selectedDoctor && (
          <div className="space-y-6">
            <Card className="shadow-none border bg-card overflow-hidden">
              <div className="bg-primary p-8 text-primary-foreground text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                <h2 className="text-2xl font-bold mb-1">Final Review</h2>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-5 p-5 bg-muted/30 rounded-2xl border">
                  <Avatar className="w-16 h-16"><AvatarImage src={selectedDoctor.avatar} /><AvatarFallback>{selectedDoctor.name[0]}</AvatarFallback></Avatar>
                  <div><h3 className="text-lg font-bold">{selectedDoctor.name}</h3><p className="text-sm font-bold text-primary italic">{selectedDoctor.specialization}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 flex items-center gap-4"><Calendar className="w-6 h-6 text-blue-600" /><div><p className="text-[9px] uppercase">Date</p><p className="text-sm font-bold">{selectedDate}</p></div></div>
                  <div className="p-4 bg-green-50/50 dark:bg-green-500/5 rounded-2xl border border-green-100 flex items-center gap-4"><Clock className="w-6 h-6 text-green-600" /><div><p className="text-[9px] uppercase">Time</p><p className="text-sm font-bold">{selectedTime}</p></div></div>
                </div>
                <Button onClick={handleBookAppointment} className="w-full h-14 text-xl font-bold rounded-2xl shadow-xl mt-2 bg-gradient-to-r from-primary to-[#81D4FA] text-white">
                  Confirm & Pay Now
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}