// Emergency keywords that trigger immediate escalation
export const emergencyKeywords = {
  en: [
    'unconscious', 'not breathing', 'stopped breathing', 'no pulse',
    'severe bleeding', 'heavy bleeding', 'blood everywhere',
    'seizure', 'convulsion', 'fitting',
    'chest pain', 'heart attack', 'cardiac',
    'stroke', 'paralysis', 'face drooping', 'arm weakness', 'slurred speech',
    'choking', 'cant breathe', "can't breathe", 'gasping',
    'poisoning', 'poison', 'overdose', 'swallowed',
    'suicide', 'kill myself', 'end my life', 'self harm', 'self-harm',
    'not responding', 'collapsed', 'passed out',
    'severe burn', 'electrocuted', 'electric shock',
    'drowning', 'near drowning',
    'anaphylaxis', 'severe allergic', 'throat closing', 'swelling throat',
    'gunshot', 'stabbed', 'stabbing',
    'head injury', 'skull', 'brain injury',
    'snake bite', 'venomous',
  ],
  hi: [
    'बेहोश', 'होश नहीं', 'सांस नहीं', 'सांस रुक',
    'बहुत खून', 'खून बह', 'खून रुक नहीं',
    'दौरा', 'झटके', 'मिर्गी',
    'सीने में दर्द', 'दिल का दौरा', 'हार्ट अटैक',
    'लकवा', 'पैरालिसिस', 'चेहरा झुक', 'हाथ कमजोर', 'बोलने में तकलीफ',
    'दम घुट', 'सांस नहीं आ', 'गला घुट',
    'ज़हर', 'विष', 'ओवरडोज़',
    'आत्महत्या', 'मरना चाहता', 'जान देना',
    'प्रतिक्रिया नहीं', 'गिर गया', 'बेहोश हो',
    'जल गया', 'बिजली का झटका', 'करंट',
    'डूब', 'पानी में',
    'एनाफिलेक्सिस', 'गंभीर एलर्जी', 'गला सूज', 'सूजन',
    'गोली', 'चाकू', 'छुरा',
    'सिर में चोट', 'खोपड़ी', 'दिमाग',
    'सांप काट', 'ज़हरीला',
  ],
};

// Red flag symptoms that require immediate attention
export const redFlagSymptoms = {
  bleeding: {
    en: ['Blood spurting', 'Cannot stop bleeding after 10 minutes', 'Large wound', 'Visible bone'],
    hi: ['खून फव्वारे की तरह', '10 मिनट बाद भी खून न रुके', 'बड़ा घाव', 'हड्डी दिखे'],
  },
  burns: {
    en: ['Burn larger than palm', 'Face/neck/hands burnt', 'Difficulty breathing', 'Blisters all over'],
    hi: ['हथेली से बड़ा जला', 'चेहरा/गर्दन/हाथ जला', 'सांस लेने में तकलीफ', 'हर जगह छाले'],
  },
  choking: {
    en: ['Cannot speak or cough', 'Lips turning blue', 'Losing consciousness'],
    hi: ['बोल या खांस नहीं पा रहा', 'होंठ नीले पड़ रहे', 'बेहोश हो रहा'],
  },
  chestPain: {
    en: ['Pain spreading to arm/jaw', 'Sweating', 'Nausea', 'Crushing chest pain'],
    hi: ['दर्द बांह/जबड़े तक', 'पसीना', 'उल्टी जैसा', 'सीने पर भारी दबाव'],
  },
  stroke: {
    en: ['Face drooping', 'Arm weakness', 'Speech difficulty', 'Sudden severe headache'],
    hi: ['चेहरा झुक गया', 'हाथ कमजोर', 'बोलने में दिक्कत', 'अचानक तेज सिरदर्द'],
  },
  seizure: {
    en: ['Seizure lasting over 5 minutes', 'Second seizure starts', 'Injury during seizure', 'First-time seizure'],
    hi: ['दौरा 5 मिनट से ज्यादा', 'दूसरा दौरा शुरू', 'दौरे में चोट', 'पहली बार दौरा'],
  },
  poisoning: {
    en: ['Difficulty breathing', 'Seizures', 'Unconscious', 'Burns around mouth'],
    hi: ['सांस में तकलीफ', 'दौरे', 'बेहोश', 'मुंह के आसपास जलन'],
  },
  allergic: {
    en: ['Throat swelling', 'Difficulty breathing', 'Widespread rash', 'Dizziness'],
    hi: ['गला सूज रहा', 'सांस में तकलीफ', 'पूरे शरीर पर दाने', 'चक्कर आना'],
  },
};

export interface SafetyCheckResult {
  isEmergency: boolean;
  detectedKeywords: string[];
  confidence: 'high' | 'medium' | 'low';
  suggestedAction: 'call_emergency' | 'escalate' | 'provide_guidance' | 'calming_mode';
}

export function checkForEmergency(text: string, language: 'en' | 'hi'): SafetyCheckResult {
  const lowerText = text.toLowerCase();
  const keywords = emergencyKeywords[language];
  const detectedKeywords: string[] = [];

  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      detectedKeywords.push(keyword);
    }
  }

  // Check for panic/anxiety indicators
  const panicIndicators = {
    en: ['scared', 'terrified', 'panicking', 'help me', 'please help', 'going to die', 'freaking out'],
    hi: ['डर', 'घबरा', 'मदद करो', 'मर जाऊं', 'बचाओ'],
  };

  const isPanic = panicIndicators[language].some(word => lowerText.includes(word.toLowerCase()));

  if (detectedKeywords.length >= 2) {
    return {
      isEmergency: true,
      detectedKeywords,
      confidence: 'high',
      suggestedAction: 'call_emergency',
    };
  }

  if (detectedKeywords.length === 1) {
    return {
      isEmergency: true,
      detectedKeywords,
      confidence: 'medium',
      suggestedAction: 'escalate',
    };
  }

  if (isPanic) {
    return {
      isEmergency: false,
      detectedKeywords: [],
      confidence: 'medium',
      suggestedAction: 'calming_mode',
    };
  }

  return {
    isEmergency: false,
    detectedKeywords: [],
    confidence: 'low',
    suggestedAction: 'provide_guidance',
  };
}

// Topics that should never provide specific medical advice
export const restrictedTopics = [
  'medicine', 'dosage', 'injection', 'prescription', 'drug',
  'दवाई', 'खुराक', 'इंजेक्शन', 'दवा',
];

export function isRestrictedTopic(text: string): boolean {
  const lowerText = text.toLowerCase();
  return restrictedTopics.some(topic => lowerText.includes(topic));
}
