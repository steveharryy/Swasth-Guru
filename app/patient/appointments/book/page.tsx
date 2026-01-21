'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
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
 import{ ArrowLeft, 
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
  CheckCircle
} from 'lucide-react';
import { doctorsData, getAvailableDoctors, type Doctor } from '@/lib/doctors-data';
import { MEDICAL_SPECIALIZATIONS } from '@/lib/specializations';

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
  'Skin rash', 'Eye problems', 'Ear pain', 'Dental pain', 'Anxiety',
  'Depression', 'Sleep problems', 'High blood pressure', 'Diabetes',
  'Heart problems', 'Pregnancy care', 'Child fever', 'Vaccination'
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const { user, isAuthenticated, isDoctor } = useAuth();
  const { language, t } = useLanguage();
  const { showNotification } = useNotification();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState<'video' | 'phone'>('video');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  useEffect(() => {
    if (!isAuthenticated || isDoctor) {
      router.push('/');
    }
  }, [isAuthenticated, isDoctor, router]);

  useEffect(() => {
    if (currentStep === 2) {
      const doctors = getAvailableDoctors(language, selectedSymptoms);
      setAvailableDoctors(doctors);
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

  const handleBookAppointment = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !user) return;

    const appointmentId = Date.now().toString();
    const appointment = {
      id: appointmentId,
      patientId: user.id,
      patientName: user.name,
      patientPhone: user.phone,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorSpecialization: selectedDoctor.specialization,
      date: selectedDate,
      time: selectedTime,
      type: consultationType,
      status: 'pending' as const,
      symptoms: selectedSymptoms,
      consultationFee: selectedDoctor.consultationFee,
      additionalNotes,
      avatar: selectedDoctor.avatar,
      createdAt: new Date().toISOString(),
      paymentStatus: 'pending' as const
    };

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

  if (!isAuthenticated || !user || isDoctor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push('/patient/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">{t('bookAppointment')}</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {bookingSteps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.step 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step.step ? <CheckCircle className="w-4 h-4" /> : step.step}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep >= step.step ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
                {index < bookingSteps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Symptoms */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('symptoms')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select your symptoms to help us find the right doctor for you
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {commonSymptoms.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={selectedSymptoms.includes(symptom)}
                      onCheckedChange={() => handleSymptomToggle(symptom)}
                    />
                    <label htmlFor={symptom} className="text-sm cursor-pointer">
                      {symptom}
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Add custom symptom:</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Describe your symptom..."
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                  />
                  <Button onClick={handleAddCustomSymptom} disabled={!customSymptom.trim()}>
                    Add
                  </Button>
                </div>
              </div>

              {selectedSymptoms.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selected symptoms:</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSymptoms.map((symptom) => (
                      <Badge key={symptom} variant="secondary" className="cursor-pointer" 
                        onClick={() => handleSymptomToggle(symptom)}>
                        {symptom} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={() => setCurrentStep(2)} 
                className="w-full"
                disabled={selectedSymptoms.length === 0}
              >
                {t('next')} - Find Doctors
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Doctor */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('availableDoctors')}</CardTitle>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by Specialization:</label>
                    <select
                      value={selectedSpecialization}
                      onChange={(e) => setSelectedSpecialization(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">All Specializations</option>
                      {MEDICAL_SPECIALIZATIONS.map((spec) => (
                        <option key={spec.id} value={spec.name}>
                          {spec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search doctors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={doctor.avatar} />
                        <AvatarFallback>
                          <Stethoscope className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">{doctor.name}</h3>
                            <p className="text-muted-foreground">{doctor.specialization}</p>
                            <p className="text-sm text-muted-foreground">{doctor.qualifications}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center mb-1">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="font-medium">{doctor.rating}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{doctor.experience}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{doctor.about}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center">
                            <Languages className="w-4 h-4 mr-1" />
                            {doctor.languages.map(lang => lang.charAt(0).toUpperCase() + lang.slice(1)).join(', ')}
                          </div>
                          <div className="flex items-center">
                            <IndianRupee className="w-4 h-4 mr-1" />
                            ₹{doctor.consultationFee}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {doctor.specialties.slice(0, 4).map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {doctor.specialties.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{doctor.specialties.length - 4} more
                            </Badge>
                          )}
                        </div>

                        <Button onClick={() => handleDoctorSelect(doctor)} className="w-full">
                          Select Doctor
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredDoctors.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No doctors found matching your criteria</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {currentStep === 3 && selectedDoctor && (
          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose your preferred date and time for consultation with {selectedDoctor.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Consultation Type */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Consultation Type:</label>
                <div className="flex space-x-4">
                  <Button
                    variant={consultationType === 'video' ? 'default' : 'outline'}
                    onClick={() => setConsultationType('video')}
                    className="flex-1"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Video Call
                  </Button>
                  <Button
                    variant={consultationType === 'phone' ? 'default' : 'outline'}
                    onClick={() => setConsultationType('phone')}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Phone Call
                  </Button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Select Date:</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {getNextAvailableDates().map((date) => (
                    <Button
                      key={date}
                      variant={selectedDate === date ? 'default' : 'outline'}
                      onClick={() => setSelectedDate(date)}
                      className="flex flex-col p-3 h-auto"
                    >
                      <span className="text-xs">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="font-medium">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Available Time Slots:</label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {selectedDoctor.availableSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? 'default' : 'outline'}
                        onClick={() => setSelectedTime(time)}
                        size="sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Notes (Optional):</label>
                <Textarea
                  placeholder="Any additional information you'd like to share with the doctor..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={() => handleDateTimeSelect(selectedDate, selectedTime)}
                className="w-full"
                disabled={!selectedDate || !selectedTime}
              >
                {t('next')} - Review Booking
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirm Booking */}
        {currentStep === 4 && selectedDoctor && (
          <Card>
            <CardHeader>
              <CardTitle>{t('confirmAppointment')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Please review your appointment details before confirming
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Doctor Info */}
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedDoctor.avatar} />
                  <AvatarFallback>
                    <Stethoscope className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedDoctor.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.specialization}</p>
                  <div className="flex items-center mt-1">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm">{selectedDoctor.rating}</span>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(selectedDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{selectedTime}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Consultation Type</p>
                  <div className="flex items-center mt-1">
                    {consultationType === 'video' ? (
                      <Video className="w-4 h-4 mr-2" />
                    ) : (
                      <Phone className="w-4 h-4 mr-2" />
                    )}
                    <span className="font-medium">
                      {consultationType === 'video' ? 'Video Call' : 'Phone Call'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Symptoms</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSymptoms.map((symptom) => (
                      <Badge key={symptom} variant="outline" className="text-xs">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>

                {additionalNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Additional Notes</p>
                    <p className="text-sm mt-1">{additionalNotes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Consultation Fee:</span>
                    <span className="text-2xl font-bold text-primary">₹{selectedDoctor.consultationFee}</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleBookAppointment} className="w-full" size="lg">
                <CheckCircle className="w-5 h-5 mr-2" />
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}