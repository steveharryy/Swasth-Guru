'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';

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
    // Welcome Page
    welcome: "Welcome to Swasth Guru",
    tagline: "Your Comprehensive Healthcare Companion",
    chooseLanguage: "Choose Language",
    speakText: "Listen to Welcome",
    logo_sub: "24/7 AI Healthcare Active",
    directing_gate: "Directing to Secure Gate...",
    login_register: "Login/Register",
    resume_session: "Resume Session →",

    // Dashboard Header & Nav
    home: "Home",
    dates: "Dates",
    files: "Files",
    me: "Profile",
    secure_encrypted: "Secure & Encrypted",
    namaste: "Hello",
    namaste_doctor: "Hello Doctor",
    my_profile_title: "My Profile",

    // Stats
    stat_upcoming: "Upcoming Appointments",
    stat_total: "Total Consultations",
    stat_records: "Medical Records",
    stat_score: "Health Score",
    stat_upcoming_short: "Upcoming",
    stat_total_short: "Total Visits",
    stat_records_short: "Records",
    stat_score_short: "Health",
    stat_last_checkup: "Last Checkup",

    // Profile Details
    personal_info: "Personal Info",
    medical_info: "Medical Info",
    full_name: "Full Name",
    phone: "Phone",
    email: "Email Address",
    address: "Address",
    gender: "Gender",
    dob: "Date of Birth",
    blood_group: "Blood Group",
    height: "Height",
    weight: "Weight",
    emergency_contact: "Emergency Contact",
    allergies: "Allergies",
    current_medications: "Current Medications",
    medical_history: "Medical History",

    // Dashboard Sections & Buttons
    book_doctor: "Book Doctor",
    my_appointments: "My Appointments",
    upcoming_visits: "Upcoming Visits",
    recent_visits: "Recent Visits",
    available_doctors: "Available Doctors",
    no_appointments: "No Appointments Found",
    book_now: "Book Now",
    see_all: "See All",
    years_exp: "Y EXP",

    // Emergency & Health Tips
    emergency: "Emergency Support",
    emergency_desc: "Any health emergency? Call our 24/7 medical support team immediately.",
    call_102: "CALL HELP: 102",
    health_tips: "Health Tips",
    tip_water_title: "Stay Hydrated",
    tip_water_desc: "Drink plenty of water throughout the day.",
    tip_sleep_title: "Good Sleep",
    tip_sleep_desc: "Ensure you get 7-8 hours of restful sleep.",
    tip_water_hindi: "पानी पीते रहें",
    tip_sleep_hindi: "पूरी नींद लें",

    // Settings
    notification_settings: "Notification Settings",
    notification_visits: "Visits Reminder",
    notification_visits_desc: "Reminders for scheduled appointments",
    notification_tips: "Health Tips",
    notification_tips_desc: "Daily health tips and updates",
    notification_emergency: "Emergency Alerts",
    notification_emergency_desc: "Critical health alerts and news",
    settings: "Settings",
    privacy: "Privacy",
    data_security: "Data & Security",
    account_prefs: "Account & Prefs",
    logout: "Log Out",
    save: "Save",
    edit: "Edit",
    cancel: "Cancel",

    // Appointments Page
    search_placeholder: "Search by doctor or symptoms...",
    appointment_over: "Appointment Over",
    payment_pending: "Payment Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    confirmed: "Confirmed",
    fee: "Fee",
    pay_now: "Pay Now",
    join_call: "Join Call",
    starting_soon: "Starting Soon",
    join_before: "Join 10 min before",
    reschedule: "Reschedule",
    cancel_visit: "Cancel Visit",
    book_again: "Book Again",

    // Consultation Pages
    consultation: "Consultation",
    chat_doctor: "Chat with Doctor",
    chat_patient: "Chat with Patient",
    start_conversation: "Start conversation...",
    type_message: "Type your message...",
    end_visit: "End visit",
    join_visit: "Join Visit",
    connecting: "Connecting...",
    live: "Live",
    disconnected: "Disconnected",
    reconnect: "Reconnect",
    consultation_notes: "Consultation Notes",
    notes_placeholder: "Write your consultation notes here...",
    save_notes: "Save Notes",
    prescription: "Prescription",
    prescription_placeholder: "Write medicines and advice...",
    send_prescription: "Send Prescription",
    upload_report: "Upload Lab Report",
    camera_denied: "Camera permission denied.",
    camera_error: "Unable to access camera.",
    patient_details: "Patient Details",
    symptoms: "Symptoms",
    no_symptoms: "No symptoms recorded",
    ready_demo: "READY FOR DEMO",
    direct_join: "Direct Join (Demo)",
    enter_consultation: "Enter Consultation",

    // Dhanvantari Drishti
    dhanvantari_drishti: "Dhanvantari Drishti (AI Vision)",
    medicine_tracker: "Medicine Tracker",
    voice_logger: "Voice Symptom Logger",

    // Doctor Profile specific
    total_patients: "Total Patients",
    experience: "Experience",
    rating: "Rating",
    clinic_address: "Clinic Address",
    specialization: "Specialization",
    qualifications: "Qualifications",
    bio: "About Biography",
    professional_info: "Professional Info",
    notification_messages: "Chat Messages",
    notification_messages_desc: "Patient chat notifications",

    // Onboarding
    profile_setup: "Profile Setup",
    onboarding_desc: "Complete your medical profile to get started",
    select_role: "Select your role",
    establish_identity: "Establish Your Identity",
    reset_selection: "Reset selection",
    patient: "Patient",
    patient_sub: "I seek care",
    doctor: "Doctor",
    doctor_sub: "I provide care",
    age: "Age",
    professional_verification: "Professional Verification",
    medical_council: "Medical Council",
    license_id: "License ID",
    verify: "Verify",
    complete_onboarding: "Complete Onboarding",
    saving_profile: "Saving Profile...",

    // Booking Flow
    booking_portal: "Booking Portal",
    select_symptoms: "Select Symptoms",
    choose_doctor: "Choose Doctor",
    select_date_time: "Select Date & Time",
    confirm_booking: "Confirm Booking",
    symptom_selection: "Symptom Selection",
    symptom_desc: "Select any symptoms you are experiencing",
    voice_diagnostics: "Voice Diagnostics",
    voice_diagnostics_desc: "Speak your symptoms in Hindi or English",
    proceed_doctor: "Proceed to Choose Doctor",
    connect_specialist: "Select Doctor",
    review_allocation: "Proceed to Confirm",
    book_appointment: "Book Appointment",
    doctor_selection: "Doctor Selection",
    scheduling_matrix: "Select Date & Time",
    confirmation_logic: "Confirm Booking",
    session_date: "Session Date",
    execution_fee: "Consultation Fee",
    compiling_transaction: "Booking your appointment..."
  },
  hindi: {
    // Welcome Page
    welcome: "स्वस्थ गुरु में आपका स्वागत है",
    tagline: "आपका संपूर्ण स्वास्थ्य साथी",
    chooseLanguage: "भाषा चुनें",
    speakText: "स्वागत संदेश हिंदी में सुनें",
    logo_sub: "२४/७ एआई स्वास्थ्य सेवा सक्रिय",
    directing_gate: "सुरक्षित द्वार पर निर्देशित किया जा रहा है...",
    login_register: "लॉगिन / पंजीकरण",
    resume_session: "सत्र फिर से शुरू करें →",

    // Dashboard Header & Nav
    home: "मुख्य पृष्ठ",
    dates: "तारीखें",
    files: "फ़ाइलें",
    me: "मेरी जानकारी",
    secure_encrypted: "सुरक्षित और एन्क्रिप्टेड",
    namaste: "नमस्ते",
    namaste_doctor: "नमस्ते डॉक्टर",
    my_profile_title: "मेरी जानकारी",

    // Stats
    stat_upcoming: "आने वाले अपॉइंटमेंट",
    stat_total: "कुल परामर्श",
    stat_records: "चिकित्सा दस्तावेज",
    stat_score: "स्वास्थ्य स्कोर",
    stat_upcoming_short: "आने वाले",
    stat_total_short: "कुल मुलाक़ात",
    stat_records_short: "दस्तावेज",
    stat_score_short: "स्वास्थ्य",
    stat_last_checkup: "पिछली जांच",

    // Profile Details
    personal_info: "निजी जानकारी",
    medical_info: "चिकित्सा जानकारी",
    full_name: "पूरा नाम",
    phone: "फ़ोन नंबर",
    email: "ईमेल का पता",
    address: "पता",
    gender: "लिंग",
    dob: "जन्म तिथि",
    blood_group: "रक्त समूह",
    height: "लंबाई",
    weight: "वजन",
    emergency_contact: "आपातकालीन संपर्क",
    allergies: "एलर्जी",
    current_medications: "अभी चल रही दवाइयाँ",
    medical_history: "पुरानी बीमारियाँ",

    // Dashboard Sections & Buttons
    book_doctor: "डॉक्टर बुक करें",
    my_appointments: "मेरे अपॉइंटमेंट",
    upcoming_visits: "आने वाली मुलाक़ात",
    recent_visits: "पिछली मुलाक़ातें",
    available_doctors: "हमारे डॉक्टर",
    no_appointments: "कोई अपॉइंटमेंट नहीं मिला",
    book_now: "अभी बुक करें",
    see_all: "सभी देखें",
    years_exp: "साल का अनुभव",

    // Emergency & Health Tips
    emergency: "आपातकालीन सहायता",
    emergency_desc: "कोई भी स्वास्थ्य आपातकाल? हमारी २४/७ मेडिकल टीम को तुरंत कॉल करें।",
    call_102: "कॉल करें: 102",
    health_tips: "स्वास्थ्य सलाह",
    tip_water_title: "पानी पीते रहें",
    tip_water_desc: "दिनभर पर्याप्त मात्रा में पानी पिएं।",
    tip_sleep_title: "पूरी नींद लें",
    tip_sleep_desc: "नियमित रूप से ७-८ घंटे की आरामदायक नींद लें।",
    tip_water_hindi: "पानी पीते रहें",
    tip_sleep_hindi: "पूरी नींद लें",

    // Settings
    notification_settings: "सूचना सेटिंग",
    notification_visits: "मुलाक़ात की याद दिलाएं",
    notification_visits_desc: "अपॉइंटमेंट के लिए समय पर याद दिलाना",
    notification_tips: "स्वास्थ्य टिप्स",
    notification_tips_desc: "दैनिक स्वास्थ्य टिप्स और सलाह",
    notification_emergency: "आपातकालीन चेतावनियाँ",
    notification_emergency_desc: "गंभीर स्वास्थ्य सूचनाएं और अपडेट",
    settings: "सेटिंग्स",
    privacy: "गोपनीयता",
    data_security: "डेटा और सुरक्षा",
    account_prefs: "खाता और प्राथमिकताएं",
    logout: "लॉग आउट",
    save: "सहेजें",
    edit: "बदलाव करें",
    cancel: "रद्द करें",

    // Appointments Page
    search_placeholder: "डॉक्टर या लक्षणों से खोजें...",
    appointment_over: "अपॉइंटमेंट समाप्त",
    payment_pending: "भुगतान बाकी",
    completed: "पूरा हुआ",
    cancelled: "रद्द हुआ",
    confirmed: "निश्चित हुआ",
    fee: "शुल्क",
    pay_now: "अभी भुगतान करें",
    join_call: "कॉल में शामिल हों",
    starting_soon: "जल्द शुरू होगा",
    join_before: "१० मिनट पहले जुड़ें",
    reschedule: "समय बदलें",
    cancel_visit: "मुलाक़ात रद्द करें",
    book_again: "फिर से बुक करें",

    // Consultation Pages
    consultation: "डॉक्टर से सलाह",
    chat_doctor: "डॉक्टर से चैट करें",
    chat_patient: "मरीज से चैट करें",
    start_conversation: "चैट शुरू करें...",
    type_message: "संदेश यहाँ लिखें...",
    end_visit: "सलाह समाप्त करें",
    join_visit: "परामर्श से जुड़ें",
    connecting: "जुड़ रहा है...",
    live: "लाइव (सक्रिय)",
    disconnected: "संपर्क टूटा",
    reconnect: "फिर से जुड़ें",
    consultation_notes: "परामर्श नोट्स",
    notes_placeholder: "यहाँ मरीज के परामर्श नोट्स लिखें...",
    save_notes: "नोट्स सहेजें",
    prescription: "प्रिस्क्रिप्शन (दवाई पर्ची)",
    prescription_placeholder: "दवाइयों के नाम और सलाह यहाँ लिखें...",
    send_prescription: "प्रिस्क्रिप्शन भेजें",
    upload_report: "लैब रिपोर्ट अपलोड करें",
    camera_denied: "कैमरा इस्तेमाल करने की अनुमति नहीं मिली।",
    camera_error: "कैमरा शुरू करने में असमर्थ।",
    patient_details: "मरीज की जानकारी",
    symptoms: "लक्षण",
    no_symptoms: "कोई लक्षण दर्ज नहीं",
    ready_demo: "डेमो के लिए तैयार",
    direct_join: "सीधे जुड़ें (डेमो)",
    enter_consultation: "सलाह कक्ष में जाएं",

    // Dhanvantari Drishti
    dhanvantari_drishti: "धन्वंतरि दृष्टि (दवाई स्कैन)",
    medicine_tracker: "दवाई ट्रैकर",
    voice_logger: "आवाज द्वारा लक्षण दर्ज करें",

    // Doctor Profile specific
    total_patients: "कुल मरीज",
    experience: "अनुभव",
    rating: "रेटिंग",
    clinic_address: "क्लिनिक का पता",
    specialization: "विशेषज्ञता",
    qualifications: "योग्यता",
    bio: "परिचय",
    professional_info: "व्यावसायिक जानकारी",
    notification_messages: "मरीज चैट",
    notification_messages_desc: "मरीज चैट संदेशों की सूचनाएं",

    // Onboarding
    profile_setup: "प्रोफ़ाइल सेटअप",
    onboarding_desc: "शुरू करने के लिए अपनी चिकित्सा प्रोफ़ाइल पूरी करें",
    select_role: "अपनी भूमिका चुनें",
    establish_identity: "अपनी पहचान स्थापित करें",
    reset_selection: "चयन रीसेट करें",
    patient: "मरीज (Patient)",
    patient_sub: "मुझे इलाज चाहिए",
    doctor: "डॉक्टर (Doctor)",
    doctor_sub: "मैं इलाज प्रदान करता हूँ",
    age: "उम्र (Age)",
    professional_verification: "पेशेवर सत्यापन",
    medical_council: "मेडिकल काउंसिल",
    license_id: "लाइसेंस नंबर (License ID)",
    verify: "सत्यापित करें",
    complete_onboarding: "ऑनबोर्डिंग पूरी करें",
    saving_profile: "प्रोफ़ाइल सहेजी जा रही है...",

    // Booking Flow
    booking_portal: "बुकिंग पोर्टल",
    select_symptoms: "लक्षण चुनें",
    choose_doctor: "डॉक्टर चुनें",
    select_date_time: "समय चुनें",
    confirm_booking: "पुष्टि करें",
    symptom_selection: "लक्षण का चयन",
    symptom_desc: "आपको जो भी लक्षण महसूस हो रहे हैं, उन्हें चुनें",
    voice_diagnostics: "बोलकर लक्षण बताएं",
    voice_diagnostics_desc: "अपने लक्षण हिंदी या अंग्रेजी में बोलें",
    proceed_doctor: "डॉक्टर चुनने के लिए आगे बढ़ें",
    connect_specialist: "डॉक्टर का चयन करें",
    review_allocation: "पुष्टि करने के लिए आगे बढ़ें",
    book_appointment: "अपॉइंटमेंट बुक करें",
    doctor_selection: "डॉक्टर का चयन",
    scheduling_matrix: "तारीख और समय चुनें",
    confirmation_logic: "बुकिंग की पुष्टि",
    session_date: "मुलाक़ात की तारीख",
    execution_fee: "परामर्श शुल्क",
    compiling_transaction: "अपॉइंटमेंट बुक किया जा रहा है..."
  },
  punjabi: {
    // Legacy support
    welcome: "ਸਵਸਥ ਗੁਰੂ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
    tagline: "ਤੁਹਾਡਾ ਸੰਪੂਰਨ ਸਿਹਤ ਸਾਥੀ",
    chooseLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ",
    speakText: "ਸੁਆਗਤ ਸੰਦੇਸ਼ ਪੰਜਾਬੀ ਵਿੱਚ ਸੁਣੋ"
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('english');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('swasthguru_language') as Language;
    if (savedLanguage && translations[savedLanguage as keyof typeof translations]) {
      setLanguageState(savedLanguage);
      setShowModal(false);
    } else {
      setShowModal(true); // First launch: trigger choice modal
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('swasthguru_language', lang);
  }, []);

  const t = useCallback((key: string): string => {
    const langTranslations = translations[language as keyof typeof translations];
    return (langTranslations as any)?.[key] || key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    isRTL: false
  }), [language, setLanguage, t]);

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    setShowModal(false);
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-3xl">🗣️</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Select Language</h2>
              <h3 className="text-xl font-bold text-muted-foreground">अपनी पसंदीदा भाषा चुनें</h3>
            </div>
            <div className="grid gap-3 pt-2">
              <button
                onClick={() => handleSelectLanguage('english')}
                className="w-full h-14 text-lg font-black border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-2xl transition-all shadow-sm hover:scale-[1.02] flex items-center justify-between px-6"
              >
                <span className="flex items-center gap-3">🇺🇸 <span>English</span></span>
                <span className="text-xs font-bold text-muted-foreground">Select →</span>
              </button>
              <button
                onClick={() => handleSelectLanguage('hindi')}
                className="w-full h-14 text-lg font-black border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-2xl transition-all shadow-sm hover:scale-[1.02] flex items-center justify-between px-6"
              >
                <span className="flex items-center gap-3">🇮🇳 <span>हिन्दी (Hindi)</span></span>
                <span className="text-xs font-bold text-muted-foreground">चुनें →</span>
              </button>
            </div>
          </div>
        </div>
      )}
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
