export type Language = 'en' | 'hi';

export const translations = {
  // App branding
  appName: {
    en: 'SwasthSewak',
    hi: 'स्वास्थ्य सेवक',
  },
  tagline: {
    en: 'Your First-Aid Guide',
    hi: 'आपका प्राथमिक चिकित्सा मार्गदर्शक',
  },

  // Emergency flow
  isEmergency: {
    en: 'Is this an emergency right now?',
    hi: 'क्या यह अभी आपातकाल है?',
  },
  emergency: {
    en: 'Emergency',
    hi: 'आपातकाल',
  },
  notEmergency: {
    en: 'Not emergency',
    hi: 'नहीं',
  },
  urgentMessage: {
    en: "This is urgent. Please call now. I'll guide you step-by-step while help is coming.",
    hi: 'यह गंभीर स्थिति है। कृपया अभी कॉल करें। मैं step-by-step मदद करूंगा/करूंगी जब तक मदद आती है।',
  },
  callNow: {
    en: 'Call Now',
    hi: 'अभी कॉल करें',
  },
  emergencyServices: {
    en: 'Emergency (112)',
    hi: 'आपातकालीन (112)',
  },
  ambulance: {
    en: 'Ambulance (108)',
    hi: 'एम्बुलेंस (108)',
  },

  // Quick assessment questions
  ageGroup: {
    en: 'Age group?',
    hi: 'उम्र का वर्ग?',
  },
  child: {
    en: 'Child (0-12)',
    hi: 'बच्चा (0-12)',
  },
  adult: {
    en: 'Adult (13-60)',
    hi: 'वयस्क (13-60)',
  },
  elderly: {
    en: 'Elderly (60+)',
    hi: 'बुज़ुर्ग (60+)',
  },
  isConscious: {
    en: 'Is the person conscious?',
    hi: 'क्या व्यक्ति होश में है?',
  },
  yes: {
    en: 'Yes',
    hi: 'हाँ',
  },
  no: {
    en: 'No',
    hi: 'नहीं',
  },
  breathingNormal: {
    en: 'Is breathing normal?',
    hi: 'क्या सांस सामान्य है?',
  },
  mainIssue: {
    en: 'What is the main issue?',
    hi: 'मुख्य समस्या क्या है?',
  },

  // Quick action chips
  bleeding: {
    en: 'Bleeding',
    hi: 'खून बहना',
  },
  burns: {
    en: 'Burns',
    hi: 'जलना',
  },
  choking: {
    en: 'Choking',
    hi: 'दम घुटना',
  },
  chestPain: {
    en: 'Chest Pain',
    hi: 'सीने में दर्द',
  },
  stroke: {
    en: 'Stroke Signs',
    hi: 'लकवा लक्षण',
  },
  seizure: {
    en: 'Seizure',
    hi: 'दौरा',
  },
  poisoning: {
    en: 'Poisoning',
    hi: 'ज़हर',
  },
  panic: {
    en: 'Panic/Anxiety',
    hi: 'घबराहट',
  },
  fainting: {
    en: 'Fainting',
    hi: 'बेहोशी',
  },
  fracture: {
    en: 'Fracture/Sprain',
    hi: 'हड्डी टूटना',
  },
  dogBite: {
    en: 'Dog/Snake Bite',
    hi: 'कुत्ते/सांप का काटना',
  },
  allergicReaction: {
    en: 'Allergic Reaction',
    hi: 'एलर्जी',
  },
  heatstroke: {
    en: 'Heatstroke',
    hi: 'लू लगना',
  },
  asthma: {
    en: 'Asthma Attack',
    hi: 'दमा का दौरा',
  },

  // Calming messages
  calmReassure: {
    en: "You're doing the right thing. Stay with me.",
    hi: 'आप सही कर रहे हैं। मैं आपके साथ हूँ।',
  },
  breathingExercise: {
    en: 'Take slow breaths: Breathe in (4 sec) → Hold (4 sec) → Breathe out (6 sec)',
    hi: 'धीरे-धीरे सांस लें: अंदर (4 सेकंड) → रोकें (4 सेकंड) → बाहर (6 सेकंड)',
  },
  stayCalm: {
    en: 'Stay calm. Help is on the way.',
    hi: 'शांत रहें। मदद आ रही है।',
  },

  // Safety disclaimer
  disclaimer: {
    en: "I'm not a doctor. This is first-aid guidance only.",
    hi: 'मैं डॉक्टर नहीं हूँ। यह सिर्फ प्राथमिक चिकित्सा मार्गदर्शन है।',
  },
  medicineDisclaimer: {
    en: 'Only take medicines previously prescribed by your doctor. For emergency symptoms, call for help immediately.',
    hi: 'केवल वो दवाइयां लें जो पहले डॉक्टर ने दी हों। आपातकालीन लक्षणों के लिए तुरंत मदद के लिए कॉल करें।',
  },

  // UI elements
  typeMessage: {
    en: 'Type your message...',
    hi: 'अपना संदेश लिखें...',
  },
  send: {
    en: 'Send',
    hi: 'भेजें',
  },
  close: {
    en: 'Close',
    hi: 'बंद करें',
  },
  switchToHindi: {
    en: 'हिंदी',
    hi: 'हिंदी',
  },
  switchToEnglish: {
    en: 'English',
    hi: 'English',
  },
  readAloud: {
    en: 'Read Aloud',
    hi: 'पढ़कर सुनाएं',
  },
  darkMode: {
    en: 'Dark Mode',
    hi: 'डार्क मोड',
  },
  lightMode: {
    en: 'Light Mode',
    hi: 'लाइट मोड',
  },

  // First aid step labels
  stepsToDo: {
    en: '✅ Steps to follow:',
    hi: '✅ ये करें:',
  },
  thingsToAvoid: {
    en: '❌ Do NOT do:',
    hi: '❌ ये ना करें:',
  },
  redFlags: {
    en: '🚨 Call for help if:',
    hi: '🚨 अगर ये हो तो मदद के लिए कॉल करें:',
  },

  // Welcome message
  welcome: {
    en: "Hello! I'm SwasthSewak, your first-aid guide. I'm here to help you stay calm and provide step-by-step guidance until a doctor is available.",
    hi: 'नमस्ते! मैं स्वास्थ्य सेवक हूँ, आपका प्राथमिक चिकित्सा मार्गदर्शक। मैं यहाँ आपको शांत रहने में मदद करने और डॉक्टर उपलब्ध होने तक step-by-step मार्गदर्शन देने के लिए हूँ।',
  },

  // Typing indicator
  typing: {
    en: 'SwasthSewak is typing...',
    hi: 'स्वास्थ्य सेवक टाइप कर रहा है...',
  },
} as const;

export function t(key: keyof typeof translations, lang: Language): string {
  return translations[key][lang];
}
