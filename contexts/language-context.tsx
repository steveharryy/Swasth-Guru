'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Language = 'english' | 'hindi' | 'punjabi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const translations = {
  english: {
    welcome: 'Welcome to SwasthGuru',
    tagline: 'Healthcare at your fingertips',
    login: 'Login',
    register: 'Register',
    patient: 'Patient',
    doctor: 'Doctor',
    phoneNumber: 'Phone Number',
    password: 'Password',
    email: 'Email Address',
    name: 'Full Name',
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    bookAppointment: 'Book Appointment',
    myAppointments: 'My Appointments',
    medicalRecords: 'Medical Records',
    profile: 'Profile',
    logout: 'Logout',
    symptoms: 'Select Symptoms',
    availableDoctors: 'Available Doctors',
    confirmAppointment: 'Confirm Appointment',
    appointmentBooked: 'Appointment Booked Successfully!',
    joinConsultation: 'Join Consultation',
    cancel: 'Cancel',
    reschedule: 'Reschedule',
    home: 'Home',
    findDoctor: 'Find Doctor',
    bookNow: 'Book Now',
    viewDetails: 'View Details',
    healthTips: 'Health Tips',
    emergency: 'Emergency',
    call: 'Call',
    message: 'Message',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    confirmed: 'Confirmed',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    next: 'Next',
    back: 'Back',
    submit: 'Submit',
    chooseLanguage: 'Choose Your Language',
    userType: 'I am a',
    sendOTP: 'Send OTP',
    verifyOTP: 'Verify OTP',
    enterOTP: 'Enter OTP sent to your phone',
    otpInfo: "We'll send a 6-digit code to verify your number",
    uploadReport: 'Upload Report',
    endCall: 'End Call',
    patientDetails: 'Patient Details',
    writeNote: 'Write Note',
    submitPrescription: 'Submit Prescription',
    upcomingAppointments: 'Upcoming Appointments',
  },
  hindi: {
    welcome: 'स्वस्थगुरु में आपका स्वागत है',
    tagline: 'आपकी उंगलियों पर स्वास्थ्य सेवा',
    login: 'लॉग इन',
    register: 'पंजीकरण',
    patient: 'रोगी',
    doctor: 'डॉक्टर',
    phoneNumber: 'फोन नंबर',
    password: 'पासवर्ड',
    email: 'ईमेल पता',
    name: 'पूरा नाम',
    dashboard: 'डैशबोर्ड',
    appointments: 'अपॉइंटमेंट',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    myAppointments: 'मेरे अपॉइंटमेंट',
    medicalRecords: 'मेडिकल रिकॉर्ड',
    profile: 'प्रोफाइल',
    logout: 'लॉगआउट',
    symptoms: 'लक्षण चुनें',
    availableDoctors: 'उपलब्ध डॉक्टर',
    confirmAppointment: 'अपॉइंटमेंट की पुष्टि करें',
    appointmentBooked: 'अपॉइंटमेंट सफलतापूर्वक बुक किया गया!',
    joinConsultation: 'परामर्श में शामिल हों',
    cancel: 'रद्द करें',
    reschedule: 'पुनर्निर्धारित करें',
    home: 'होम',
    findDoctor: 'डॉक्टर ढूंढें',
    bookNow: 'अभी बुक करें',
    viewDetails: 'विवरण देखें',
    healthTips: 'स्वास्थ्य टिप्स',
    emergency: 'आपातकालीन',
    call: 'कॉल करें',
    message: 'संदेश',
    date: 'तारीख',
    time: 'समय',
    status: 'स्थिति',
    confirmed: 'पुष्टि की गई',
    pending: 'लंबित',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    next: 'अगला',
    back: 'पीछे',
    submit: 'जमा करें',
    chooseLanguage: 'अपनी भाषा चुनें',
    userType: 'मैं हूँ',
    sendOTP: 'OTP भेजें',
    verifyOTP: 'OTP सत्यापित करें',
    enterOTP: 'आपके फोन पर भेजे गए OTP दर्ज करें',
    otpInfo: 'हम आपके नंबर को सत्यापित करने के लिए 6-अंकों का कोड भेजेंगे',
    uploadReport: 'रिपोर्ट अपलोड करें',
    endCall: 'कॉल समाप्त करें',
    patientDetails: 'रोगी का विवरण',
    writeNote: 'नोट लिखें',
    submitPrescription: 'प्रिस्क्रिप्शन जमा करें',
    upcomingAppointments: 'आगामी अपॉइंटमेंट',
  },
 punjabi: {
    welcome: 'ਸਵਸਥਗੁਰੂ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ',
    tagline: 'ਤੁਹਾਡੇ ਉਂਗਲਾਂ ਦੀ ਨੋਕ ਤੇ ਸਿਹਤ ਸੇਵਾ',
    login: 'ਲਾਗਇਨ',
    register: 'ਰਜਿਸਟਰ ਕਰੋ',
    patient: 'ਮਰੀਜ਼',
    doctor: 'ਡਾਕਟਰ',
    phoneNumber: 'ਫੋਨ ਨੰਬਰ',
    password: 'ਪਾਸਵਰਡ',
    email: 'ਈਮੇਲ ਐਡਰੈੱਸ',
    name: 'ਪੂਰਾ ਨਾਮ',
    dashboard: 'ਡੈਸ਼ਬੋਰਡ',
    appointments: 'ਮੁਲਾਕਾਤਾਂ',
    bookAppointment: 'ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ',
    myAppointments: 'ਮੇਰੀਆਂ ਮੁਲਾਕਾਤਾਂ',
    medicalRecords: 'ਮੈਡੀਕਲ ਰਿਕਾਰਡ',
    profile: 'ਪ੍ਰੋਫਾਈਲ',
    logout: 'ਲਾੱਗ ਆਉਟ',
    symptoms: 'ਲੱਛਣ ਚੁਣੋ',
    availableDoctors: 'ਉਪਲਬਧ ਡਾਕਟਰ',
    confirmAppointment: 'ਮੁਲਾਕਾਤ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
    appointmentBooked: 'ਮੁਲਾਕਾਤ ਸਫਲਤਾਪੂਰਵਕ ਬੁੱਕ ਹੋ ਗਈ!',
    joinConsultation: 'ਸਲਾਹ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    reschedule: 'ਮੁੜ-ਸ਼ੈਡਿਊਲ ਕਰੋ',
    home: 'ਮੁੱਖ ਸਫ਼ਾ',
    findDoctor: 'ਡਾਕਟਰ ਲੱਭੋ',
    bookNow: 'ਹੁਣੇ ਬੁੱਕ ਕਰੋ',
    viewDetails: 'ਵੇਰਵੇ ਵੇਖੋ',
    healthTips: 'ਸਿਹਤ ਸੁਝਾਅ',
    emergency: 'ਐਮਰਜੈਂਸੀ',
    call: 'ਕਾਲ',
    message: 'ਸੁਨੇਹਾ',
    date: 'ਤਾਰੀਖ',
    time: 'ਸਮਾਂ',
    status: 'ਸਥਿਤੀ',
    confirmed: 'ਪੁਸ਼ਟੀ ਹੋਈ',
    pending: 'ਬਕਾਇਆ',
    completed: 'ਪੂਰਾ ਹੋਇਆ',
    cancelled: 'ਰੱਦ ਕੀਤਾ',
    next: 'ਅਗਲਾ',
    back: 'ਪਿੱਛੇ',
    submit: 'ਜਮ੍ਹਾਂ ਕਰੋ',
    chooseLanguage: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    userType: 'ਮੈਂ ਇੱਕ ਹਾਂ',
    sendOTP: 'OTP ਭੇਜੋ',
    verifyOTP: 'OTP ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
    enterOTP: 'ਆਪਣੇ ਫੋਨ ਤੇ ਭੇਜੇ OTP ਦਰਜ ਕਰੋ',
    otpInfo: 'ਅਸੀਂ ਤੁਹਾਡੇ ਨੰਬਰ ਦੀ ਪੁਸ਼ਟੀ ਕਰਨ ਲਈ 6-ਅੰਕਾਂ ਦਾ ਕੋਡ ਭੇਜਾਂਗੇ',
    uploadReport: 'ਰਿਪੋਰਟ ਅਪਲੋਡ ਕਰੋ',
    endCall: 'ਕਾਲ ਖਤਮ ਕਰੋ',
    patientDetails: 'ਮਰੀਜ਼ ਦੀਆਂ ਜਾਣਕਾਰੀਆਂ',
    writeNote: 'ਨੋਟ ਲਿਖੋ',
    submitPrescription: 'ਨੁਸਖ਼ਾ ਜਮ੍ਹਾਂ ਕਰੋ',
    upcomingAppointments: 'ਆਉਣ ਵਾਲੀਆਂ ਮੁਲਾਕਾਤਾਂ'
  },

  
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('english');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('swasthguru_language') as Language;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('swasthguru_language', lang);
  };

 const t = (key: string): string => {
  const langTranslations = translations[language as keyof typeof translations];
  return langTranslations?.[key as keyof typeof langTranslations] || key;
};

  const isRTL = false; // None of our supported languages are RTL

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}