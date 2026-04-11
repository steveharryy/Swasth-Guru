import { Language } from './translations';

export interface FirstAidGuide {
  steps: string[];
  avoid: string[];
  redFlags: string[];
}

export interface FirstAidGuides {
  en: FirstAidGuide;
  hi: FirstAidGuide;
}

export const firstAidGuides: Record<string, FirstAidGuides> = {
  bleeding: {
    en: {
      steps: [
        'Apply firm, direct pressure with a clean cloth',
        'Keep the injured area raised above heart level if possible',
        'Do NOT remove the cloth if blood soaks through - add more cloth on top',
        'Apply pressure for at least 10 minutes without checking',
        'Once bleeding stops, bandage the wound firmly',
      ],
      avoid: [
        'Do NOT remove objects stuck in the wound',
        'Do NOT apply tourniquet unless trained',
        'Do NOT wash deep wounds',
      ],
      redFlags: [
        'Blood spurting or pulsing',
        'Bleeding doesn\'t slow after 10 minutes of pressure',
        'Wound is very deep or has visible bone',
        'Feeling faint or cold and clammy',
      ],
    },
    hi: {
      steps: [
        'साफ कपड़े से घाव पर सीधा ज़ोर से दबाएं',
        'अगर हो सके तो घायल हिस्से को दिल से ऊपर रखें',
        'अगर कपड़ा खून से भीग जाए तो हटाएं नहीं - ऊपर से और कपड़ा रखें',
        'कम से कम 10 मिनट तक बिना देखे दबाव बनाए रखें',
        'खून रुकने के बाद पट्टी से कसकर बांधें',
      ],
      avoid: [
        'घाव में फंसी चीज़ निकालने की कोशिश ना करें',
        'बिना ट्रेनिंग के टूर्निकेट ना लगाएं',
        'गहरे घाव को धोएं नहीं',
      ],
      redFlags: [
        'खून फव्वारे की तरह निकल रहा हो',
        '10 मिनट दबाने के बाद भी खून कम न हो',
        'बहुत गहरा घाव या हड्डी दिखे',
        'कमज़ोरी लगे या ठंडा पसीना आए',
      ],
    },
  },
  burns: {
    en: {
      steps: [
        'Cool the burn under cool (not cold) running water for 10-20 minutes',
        'Remove jewelry or tight items near the burn before swelling',
        'Cover loosely with a clean, dry cloth or cling wrap',
        'Give small sips of water if conscious',
        'Keep the person warm to prevent shock',
      ],
      avoid: [
        'Do NOT use ice, butter, toothpaste, or any cream',
        'Do NOT break blisters',
        'Do NOT remove clothing stuck to the burn',
        'Do NOT touch the burned area',
      ],
      redFlags: [
        'Burn is larger than palm size',
        'Face, hands, feet, or groin are burned',
        'Burn goes all around a limb',
        'Difficulty breathing (smoke inhalation)',
        'White or charred skin (severe burn)',
      ],
    },
    hi: {
      steps: [
        'जले हुए हिस्से को 10-20 मिनट ठंडे (बर्फीले नहीं) पानी में रखें',
        'सूजन से पहले पास की अंगूठी या कसी चीज़ें उतार दें',
        'साफ सूखे कपड़े या क्लिंग फिल्म से ढीला ढकें',
        'अगर होश में है तो थोड़ा-थोड़ा पानी पिलाएं',
        'शॉक से बचने के लिए व्यक्ति को गर्म रखें',
      ],
      avoid: [
        'बर्फ, मक्खन, टूथपेस्ट या कोई क्रीम ना लगाएं',
        'छाले ना फोड़ें',
        'जले से चिपके कपड़े ना हटाएं',
        'जली जगह को छुएं नहीं',
      ],
      redFlags: [
        'जला हुआ हिस्सा हथेली से बड़ा हो',
        'चेहरा, हाथ, पैर या गुप्तांग जले हों',
        'जला पूरे अंग के चारों ओर हो',
        'सांस लेने में तकलीफ (धुआं अंदर जाने से)',
        'सफेद या झुलसी त्वचा (गंभीर जलन)',
      ],
    },
  },
  choking: {
    en: {
      steps: [
        'Encourage them to cough hard',
        'If coughing doesn\'t work, give 5 firm back blows between shoulder blades',
        'If still choking, do 5 abdominal thrusts (Heimlich): stand behind, make a fist above navel, pull sharply inward and upward',
        'Alternate between 5 back blows and 5 thrusts',
        'If unconscious, call 112 and start CPR',
      ],
      avoid: [
        'Do NOT put fingers in mouth blindly',
        'Do NOT do abdominal thrusts on pregnant women (use chest thrusts)',
        'Do NOT give water while actively choking',
      ],
      redFlags: [
        'Cannot speak, cough, or breathe',
        'Lips or face turning blue',
        'Becoming unconscious',
      ],
    },
    hi: {
      steps: [
        'उन्हें ज़ोर से खांसने के लिए कहें',
        'अगर खांसी काम न करे तो कंधों के बीच 5 ज़ोरदार थपकी दें',
        'अगर अभी भी दम घुट रहा हो तो 5 पेट के झटके दें (Heimlich): पीछे खड़े होकर, नाभि के ऊपर मुट्ठी बनाएं, अंदर और ऊपर की ओर खींचें',
        '5 पीठ पर थपकी और 5 झटके बारी-बारी से दें',
        'अगर बेहोश हो जाएं तो 112 पर कॉल करें और CPR शुरू करें',
      ],
      avoid: [
        'अंधाधुंध मुंह में उंगली ना डालें',
        'गर्भवती महिलाओं पर पेट के झटके ना दें (छाती पर झटके दें)',
        'दम घुटते समय पानी ना दें',
      ],
      redFlags: [
        'बोल, खांस या सांस नहीं ले पा रहा',
        'होंठ या चेहरा नीला पड़ रहा है',
        'बेहोश हो रहा है',
      ],
    },
  },
  chestPain: {
    en: {
      steps: [
        'Call 112 immediately - this could be a heart attack',
        'Help them sit in a comfortable position, slightly reclined',
        'Loosen any tight clothing around neck and chest',
        'If they have prescribed aspirin and are not allergic, give 1 tablet to chew',
        'Stay with them and keep them calm',
        'If unconscious and not breathing, start CPR',
      ],
      avoid: [
        'Do NOT let them walk around',
        'Do NOT give food or water',
        'Do NOT leave them alone',
        'Do NOT ignore symptoms - time is critical',
      ],
      redFlags: [
        'Pain spreading to arm, jaw, or back',
        'Sweating, nausea, or vomiting',
        'Difficulty breathing',
        'Crushing or squeezing chest pain',
      ],
    },
    hi: {
      steps: [
        'तुरंत 112 पर कॉल करें - यह हार्ट अटैक हो सकता है',
        'उन्हें आरामदायक स्थिति में थोड़ा टेक लगाकर बैठाएं',
        'गले और छाती के पास के कसे कपड़े ढीले करें',
        'अगर उनके पास डॉक्टर की दी हुई एस्पिरिन है और एलर्जी नहीं है, तो 1 गोली चबाने को दें',
        'उनके साथ रहें और शांत रखें',
        'अगर बेहोश हों और सांस न ले रहे हों, तो CPR शुरू करें',
      ],
      avoid: [
        'उन्हें चलने-फिरने ना दें',
        'खाना या पानी ना दें',
        'उन्हें अकेला ना छोड़ें',
        'लक्षणों को अनदेखा ना करें - समय बहुत महत्वपूर्ण है',
      ],
      redFlags: [
        'दर्द बांह, जबड़े या पीठ तक फैल रहा हो',
        'पसीना, जी मिचलाना या उल्टी',
        'सांस लेने में तकलीफ',
        'सीने पर भारी दबाव जैसा दर्द',
      ],
    },
  },
  stroke: {
    en: {
      steps: [
        'Remember FAST: Face drooping, Arm weakness, Speech difficulty, Time to call 112',
        'Call 112 immediately and tell them "possible stroke"',
        'Note the exact time symptoms started - this is critical for treatment',
        'Help them lie down with head slightly raised',
        'Turn them on their side if vomiting',
        'Do NOT give food, water, or any medicine',
      ],
      avoid: [
        'Do NOT give aspirin (may worsen bleeding strokes)',
        'Do NOT give food or water (swallowing may be affected)',
        'Do NOT let them sleep it off',
        'Do NOT wait to see if symptoms go away',
      ],
      redFlags: [
        'Sudden face drooping on one side',
        'Arm drift when raised',
        'Slurred or confused speech',
        'Sudden severe headache',
        'Loss of balance or coordination',
      ],
    },
    hi: {
      steps: [
        'FAST याद रखें: Face झुका, Arm कमज़ोर, Speech में दिक्कत, Time - 112 पर कॉल करें',
        'तुरंत 112 पर कॉल करें और बताएं "लकवे का संदेह"',
        'लक्षण शुरू होने का सही समय नोट करें - इलाज के लिए बहुत ज़रूरी है',
        'उन्हें सिर थोड़ा ऊंचा करके लिटाएं',
        'अगर उल्टी हो तो करवट दिलाएं',
        'खाना, पानी या कोई दवा ना दें',
      ],
      avoid: [
        'एस्पिरिन ना दें (ब्लीडिंग स्ट्रोक बिगड़ सकता है)',
        'खाना या पानी ना दें (निगलने में दिक्कत हो सकती है)',
        'सोने ना दें कि "आराम से ठीक हो जाएगा"',
        'लक्षण अपने आप जाने का इंतज़ार ना करें',
      ],
      redFlags: [
        'अचानक चेहरे का एक तरफ झुक जाना',
        'हाथ उठाने पर गिर जाना',
        'बोलने में लड़खड़ाहट या भ्रम',
        'अचानक तेज़ सिरदर्द',
        'संतुलन बिगड़ना',
      ],
    },
  },
  seizure: {
    en: {
      steps: [
        'Stay calm - most seizures stop on their own in 1-3 minutes',
        'Clear the area of sharp or hard objects',
        'Place something soft under their head',
        'Turn them gently on their side when jerking stops',
        'Time the seizure',
        'Stay with them until fully conscious',
      ],
      avoid: [
        'Do NOT hold them down or restrain movement',
        'Do NOT put anything in their mouth',
        'Do NOT give water or medicine during seizure',
        'Do NOT slap or shake them',
      ],
      redFlags: [
        'Seizure lasts more than 5 minutes',
        'Second seizure starts',
        'They are injured',
        'It\'s their first seizure',
        'Breathing difficulty after seizure',
        'They are pregnant or diabetic',
      ],
    },
    hi: {
      steps: [
        'शांत रहें - ज़्यादातर दौरे 1-3 मिनट में खुद रुक जाते हैं',
        'आसपास से नुकीली या कठोर चीज़ें हटा दें',
        'उनके सिर के नीचे कुछ मुलायम रखें',
        'झटके रुकने पर उन्हें धीरे से करवट दिलाएं',
        'दौरे का समय नोट करें',
        'पूरी तरह होश आने तक साथ रहें',
      ],
      avoid: [
        'उन्हें पकड़कर रोकें नहीं',
        'मुंह में कुछ ना डालें',
        'दौरे के दौरान पानी या दवा ना दें',
        'थप्पड़ ना मारें या ना हिलाएं',
      ],
      redFlags: [
        'दौरा 5 मिनट से ज़्यादा चले',
        'दूसरा दौरा शुरू हो जाए',
        'चोट लग जाए',
        'पहली बार दौरा आया हो',
        'दौरे के बाद सांस लेने में दिक्कत',
        'गर्भवती या मधुमेह (डायबिटीज़) रोगी हों',
      ],
    },
  },
  poisoning: {
    en: {
      steps: [
        'Call 112 immediately and Poison Control if available',
        'Try to identify what was swallowed and when',
        'Do NOT make them vomit unless told by a doctor',
        'If chemical on skin, remove contaminated clothing and rinse skin for 20 minutes',
        'If chemical in eyes, rinse with water for 20 minutes',
        'Keep the container or sample to show medical help',
      ],
      avoid: [
        'Do NOT induce vomiting (may cause more damage)',
        'Do NOT give food or water unless advised',
        'Do NOT wait for symptoms to appear',
        'Do NOT use home remedies like milk or salt water',
      ],
      redFlags: [
        'Difficulty breathing',
        'Seizures or convulsions',
        'Unconsciousness',
        'Burns around mouth or lips',
        'Strong chemical smell on breath',
      ],
    },
    hi: {
      steps: [
        'तुरंत 112 पर कॉल करें',
        'पता करें कि क्या निगला गया और कब',
        'उल्टी ना कराएं जब तक डॉक्टर ना कहे',
        'अगर त्वचा पर केमिकल है, तो दूषित कपड़े उतारें और 20 मिनट पानी से धोएं',
        'अगर आंख में केमिकल है, तो 20 मिनट पानी से धोएं',
        'डॉक्टर को दिखाने के लिए डिब्बा या नमूना रखें',
      ],
      avoid: [
        'उल्टी ना कराएं (और नुकसान हो सकता है)',
        'बिना सलाह के खाना-पानी ना दें',
        'लक्षण आने का इंतज़ार ना करें',
        'दूध या नमक पानी जैसे घरेलू नुस्खे ना आज़माएं',
      ],
      redFlags: [
        'सांस लेने में तकलीफ',
        'दौरे',
        'बेहोशी',
        'मुंह या होंठों के आसपास जलन के निशान',
        'सांस में केमिकल की तेज़ गंध',
      ],
    },
  },
  panic: {
    en: {
      steps: [
        'You\'re safe. This feeling will pass.',
        'Let\'s breathe together slowly:',
        '→ Breathe IN for 4 seconds',
        '→ HOLD for 4 seconds',
        '→ Breathe OUT slowly for 6 seconds',
        'Focus on something you can see, touch, or hear around you',
        'These feelings are uncomfortable but not dangerous',
      ],
      avoid: [
        'Don\'t tell them to "just calm down"',
        'Don\'t crowd them',
        'Don\'t force them to talk if they can\'t',
      ],
      redFlags: [
        'Chest pain that persists',
        'Numbness in face or arm',
        'Fainting or losing consciousness',
        'Thoughts of self-harm',
      ],
    },
    hi: {
      steps: [
        'आप सुरक्षित हैं। यह भावना गुज़र जाएगी।',
        'आइए साथ में धीरे-धीरे सांस लें:',
        '→ 4 सेकंड अंदर सांस लें',
        '→ 4 सेकंड रोकें',
        '→ 6 सेकंड धीरे-धीरे बाहर छोड़ें',
        'अपने आसपास कुछ देखें, छुएं या सुनें जिस पर ध्यान दे सकें',
        'ये भावनाएं असुविधाजनक हैं लेकिन खतरनाक नहीं',
      ],
      avoid: [
        '"बस शांत हो जाओ" मत कहें',
        'उनके आसपास भीड़ ना लगाएं',
        'अगर बोल नहीं पा रहे तो ज़बरदस्ती ना करें',
      ],
      redFlags: [
        'सीने में दर्द बना रहे',
        'चेहरे या बांह में सुन्नपन',
        'बेहोशी',
        'खुद को नुकसान पहुंचाने के विचार',
      ],
    },
  },
  fainting: {
    en: {
      steps: [
        'Help them lie down flat',
        'Raise their legs above heart level',
        'Loosen any tight clothing',
        'Check if they\'re breathing',
        'If unconscious for more than 1 minute, call 112',
        'When they wake up, keep them lying down for a few minutes',
      ],
      avoid: [
        'Do NOT throw water on face',
        'Do NOT give anything to eat or drink until fully conscious',
        'Do NOT let them get up too quickly',
      ],
      redFlags: [
        'Unconscious for more than 1 minute',
        'Hit their head when falling',
        'Not breathing normally',
        'Chest pain or irregular heartbeat',
        'Fainting repeatedly',
      ],
    },
    hi: {
      steps: [
        'उन्हें सीधा लिटा दें',
        'उनके पैर दिल से ऊपर उठाएं',
        'कसे कपड़े ढीले करें',
        'सांस ले रहे हैं या नहीं, जांचें',
        'अगर 1 मिनट से ज़्यादा बेहोश रहें, तो 112 पर कॉल करें',
        'होश आने पर कुछ मिनट लिटाए रखें',
      ],
      avoid: [
        'चेहरे पर पानी ना फेंकें',
        'पूरी तरह होश आने तक खाना-पानी ना दें',
        'जल्दी उठने ना दें',
      ],
      redFlags: [
        '1 मिनट से ज़्यादा बेहोश रहें',
        'गिरते समय सिर में चोट लगी हो',
        'सांस सामान्य ना हो',
        'सीने में दर्द या दिल की धड़कन असामान्य',
        'बार-बार बेहोश होना',
      ],
    },
  },
  fracture: {
    en: {
      steps: [
        'Keep the injured area still - do NOT try to move or straighten it',
        'Support the injury with padding (towels, pillows)',
        'Apply ice wrapped in cloth for 15-20 minutes',
        'Keep the injured limb raised if possible',
        'Check for signs of blood flow (warmth, color) below the injury',
      ],
      avoid: [
        'Do NOT move the person unnecessarily',
        'Do NOT try to push bone back in',
        'Do NOT apply heat',
        'Do NOT give food or drink if surgery may be needed',
      ],
      redFlags: [
        'Bone is visible through skin',
        'Limb looks bent or deformed',
        'No feeling or circulation below injury',
        'Severe pain or swelling',
        'Cannot move fingers/toes',
      ],
    },
    hi: {
      steps: [
        'घायल हिस्से को हिलाने या सीधा करने की कोशिश ना करें - स्थिर रखें',
        'तकिए या तौलिए से सहारा दें',
        'कपड़े में बर्फ लपेटकर 15-20 मिनट लगाएं',
        'अगर हो सके तो घायल अंग को ऊंचा रखें',
        'चोट के नीचे खून का बहाव (गर्मी, रंग) जांचें',
      ],
      avoid: [
        'व्यक्ति को बेवजह हिलाएं नहीं',
        'हड्डी को अंदर धकेलने की कोशिश ना करें',
        'गर्मी ना लगाएं',
        'अगर सर्जरी हो सकती है तो खाना-पानी ना दें',
      ],
      redFlags: [
        'हड्डी त्वचा से बाहर दिखे',
        'अंग टेढ़ा या विकृत दिखे',
        'चोट के नीचे कोई अहसास या ब्लड फ्लो ना हो',
        'तेज़ दर्द या सूजन',
        'उंगलियां/पैर की उंगलियां हिला ना सकें',
      ],
    },
  },
  dogBite: {
    en: {
      steps: [
        'Wash the wound immediately with soap and running water for 10-15 minutes',
        'Apply antiseptic if available',
        'Cover with a clean bandage',
        'Note details about the animal (owned/stray, vaccinated if known)',
        'Seek medical care - you may need rabies vaccination',
        'Report the bite to local authorities',
      ],
      avoid: [
        'Do NOT apply traditional remedies like turmeric or chili',
        'Do NOT close the wound tightly',
        'Do NOT delay seeking medical care',
      ],
      redFlags: [
        'Deep or large wound',
        'Heavy bleeding',
        'Bite on face, neck, hands, or genitals',
        'Unknown or stray animal',
        'Snake bite (always emergency)',
      ],
    },
    hi: {
      steps: [
        'घाव को तुरंत साबुन और बहते पानी से 10-15 मिनट धोएं',
        'अगर उपलब्ध हो तो एंटीसेप्टिक लगाएं',
        'साफ पट्टी से ढकें',
        'जानवर की जानकारी नोट करें (पालतू/आवारा, टीकाकरण)',
        'डॉक्टर के पास जाएं - रेबीज़ का टीका लग सकता है',
        'स्थानीय अधिकारियों को बताएं',
      ],
      avoid: [
        'हल्दी या मिर्च जैसे घरेलू नुस्खे ना लगाएं',
        'घाव को कसकर बंद ना करें',
        'डॉक्टर के पास जाने में देर ना करें',
      ],
      redFlags: [
        'गहरा या बड़ा घाव',
        'बहुत खून बह रहा हो',
        'चेहरे, गले, हाथ या गुप्तांगों पर काटा हो',
        'अनजान या आवारा जानवर',
        'सांप का काटना (हमेशा आपातकाल)',
      ],
    },
  },
  allergicReaction: {
    en: {
      steps: [
        'If they have an EpiPen, help them use it on outer thigh',
        'Call 112 immediately for severe reactions',
        'Help them sit up to ease breathing',
        'If they have antihistamines prescribed, help them take it',
        'Remove the allergen if possible (food from mouth, stinger, etc.)',
        'Stay with them and monitor breathing',
      ],
      avoid: [
        'Do NOT give food or drink if having trouble swallowing',
        'Do NOT leave them alone',
        'Do NOT wait to see if it gets better',
      ],
      redFlags: [
        'Throat swelling or difficulty breathing',
        'Widespread hives or rash',
        'Dizziness or fainting',
        'Severe stomach pain or vomiting',
        'Rapid heartbeat',
      ],
    },
    hi: {
      steps: [
        'अगर उनके पास EpiPen है, तो जांघ के बाहरी हिस्से पर इस्तेमाल करने में मदद करें',
        'गंभीर प्रतिक्रिया के लिए तुरंत 112 पर कॉल करें',
        'सांस आसान करने के लिए बैठने में मदद करें',
        'अगर डॉक्टर की दी हुई एंटीहिस्टामिन है, तो लेने में मदद करें',
        'अगर हो सके तो एलर्जन हटाएं (मुंह से खाना, डंक, आदि)',
        'साथ रहें और सांस पर नज़र रखें',
      ],
      avoid: [
        'निगलने में दिक्कत हो तो खाना-पानी ना दें',
        'अकेला ना छोड़ें',
        'बेहतर होने का इंतज़ार ना करें',
      ],
      redFlags: [
        'गला सूजना या सांस लेने में तकलीफ',
        'पूरे शरीर पर दाने या चकत्ते',
        'चक्कर आना या बेहोश होना',
        'तेज़ पेट दर्द या उल्टी',
        'दिल की धड़कन तेज़',
      ],
    },
  },
  heatstroke: {
    en: {
      steps: [
        'Move to a cool, shaded place immediately',
        'Remove excess clothing',
        'Cool the body with wet cloths on neck, armpits, groin',
        'Fan them continuously',
        'Give small sips of cool water if conscious',
        'Call 112 if body is very hot (over 40°C/104°F)',
      ],
      avoid: [
        'Do NOT give very cold water to drink',
        'Do NOT use ice directly on skin',
        'Do NOT give fever medicine like paracetamol',
      ],
      redFlags: [
        'Body temperature very high',
        'Confusion or unconsciousness',
        'Not sweating despite heat',
        'Rapid breathing or heartbeat',
        'Seizures',
      ],
    },
    hi: {
      steps: [
        'तुरंत ठंडी, छायादार जगह ले जाएं',
        'अतिरिक्त कपड़े उतारें',
        'गले, बगल, जांघों पर गीले कपड़े से शरीर ठंडा करें',
        'लगातार पंखा करें',
        'होश में हो तो थोड़ा-थोड़ा ठंडा पानी पिलाएं',
        'शरीर बहुत गर्म हो (40°C/104°F से ऊपर) तो 112 पर कॉल करें',
      ],
      avoid: [
        'बहुत ठंडा पानी पीने को ना दें',
        'बर्फ सीधे त्वचा पर ना लगाएं',
        'पैरासिटामोल जैसी बुखार की दवा ना दें',
      ],
      redFlags: [
        'शरीर का तापमान बहुत ज़्यादा',
        'भ्रम या बेहोशी',
        'गर्मी में भी पसीना न आए',
        'तेज़ सांस या धड़कन',
        'दौरे',
      ],
    },
  },
  asthma: {
    en: {
      steps: [
        'Help them sit upright - do NOT lie down',
        'Help use their inhaler (blue reliever): shake, 1 puff, breathe in slowly, hold 10 sec',
        'Repeat up to 10 puffs if needed, 1 puff per minute',
        'Stay calm and reassure them',
        'Call 112 if no improvement after 10 puffs',
        'Keep giving 1 puff every minute while waiting for help',
      ],
      avoid: [
        'Do NOT let them lie down',
        'Do NOT leave them alone',
        'Do NOT give cold water',
      ],
      redFlags: [
        'No improvement after inhaler',
        'Cannot speak full sentences',
        'Lips or fingernails turning blue',
        'Exhausted from breathing effort',
        'Confusion or drowsiness',
      ],
    },
    hi: {
      steps: [
        'सीधा बैठने में मदद करें - लिटाएं नहीं',
        'इनहेलर इस्तेमाल करने में मदद करें (नीला): हिलाएं, 1 पफ, धीरे अंदर लें, 10 सेकंड रोकें',
        'ज़रूरत हो तो 10 पफ तक दें, 1 पफ प्रति मिनट',
        'शांत रहें और उन्हें भरोसा दिलाएं',
        '10 पफ के बाद भी सुधार न हो तो 112 पर कॉल करें',
        'मदद आने तक हर मिनट 1 पफ देते रहें',
      ],
      avoid: [
        'लिटाएं नहीं',
        'अकेला ना छोड़ें',
        'ठंडा पानी ना दें',
      ],
      redFlags: [
        'इनहेलर के बाद भी सुधार न हो',
        'पूरे वाक्य न बोल पाए',
        'होंठ या नाखून नीले पड़ रहे हों',
        'सांस लेने की कोशिश से थक गए हों',
        'भ्रम या नींद आ रही हो',
      ],
    },
  },
};

export function getFirstAidGuide(topic: string, language: Language): FirstAidGuide | null {
  const guide = firstAidGuides[topic];
  if (!guide) return null;
  return guide[language];
}
