'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircleHeart } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { MessageBubble, Message } from './MessageBubble';
import { EmergencyBanner } from './EmergencyBanner';
import { EmergencyQuestion } from './EmergencyQuestion';
import { QuickActions } from './QuickActions';
import { AssessmentQuestions, AssessmentStep } from './AssessmentQuestions';
import { TypingIndicator } from './TypingIndicator';
import { BreathingGuide } from './BreathingGuide';
import { Language, t } from '@/lib/translations';
import { checkForEmergency, SafetyCheckResult } from '@/lib/safetyFilter';
import { getFirstAidGuide } from '@/lib/firstAidGuides';
import { analyzeSymptomsAndTriage } from '@/lib/ai-api';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [isDark, setIsDark] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(false);
  const [showLanguagePrompt, setShowLanguagePrompt] = useState(true);
  const [showEmergencyQuestion, setShowEmergencyQuestion] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [assessmentStep, setAssessmentStep] = useState<AssessmentStep | null>(null);
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [assessmentData, setAssessmentData] = useState<Record<string, string>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, showEmergencyBanner, showBreathingGuide]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const addMessage = useCallback((content: string, role: 'user' | 'assistant' | 'system', options?: Partial<Message>) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      ...options,
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const simulateTyping = useCallback(async (content: string, options?: Partial<Message>) => {
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));
    setIsTyping(false);
    
    // Auto Voice Read-aloud
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(content);
      // Auto-detect Hindi characters to dynamically assign the correct voice profile
      const isHindiText = /[\u0900-\u097F]/.test(content);
      utterance.lang = isHindiText ? 'hi-IN' : 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
    
    addMessage(content, 'assistant', { hasDisclaimer: true, ...options });
  }, [addMessage, language]);

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage("Welcome! Please select your language / नमस्ते! कृपया अपनी भाषा चुनें:", 'assistant', { hasDisclaimer: false });
      }, 300);
    }
  };

  const handleLanguageSelect = async (lang: Language) => {
    setLanguage(lang);
    setShowLanguagePrompt(false);
    addMessage(lang === 'en' ? 'English' : 'हिंदी', 'user');
    
    await simulateTyping(t('welcome', lang), { hasDisclaimer: true });
    setShowEmergencyQuestion(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleEmergency = async () => {
    setShowEmergencyQuestion(false);
    setShowEmergencyBanner(true);
    addMessage(language === 'en' ? 'Emergency' : 'आपातकाल', 'user');
    setAssessmentStep('age');
  };

  const handleNotEmergency = async () => {
    setShowEmergencyQuestion(false);
    setShowQuickActions(true);
    addMessage(language === 'en' ? 'Not emergency' : 'नहीं', 'user');
    await simulateTyping(
      language === 'en'
        ? "That's okay. I'm here to help. What would you like guidance on? You can tap a topic below or type your question."
        : "ठीक है। मैं मदद के लिए यहाँ हूँ। आपको किस विषय पर मार्गदर्शन चाहिए? नीचे विषय चुनें या अपना सवाल लिखें।"
    );
  };

  const handleAssessmentAnswer = async (answer: string, step: AssessmentStep) => {
    const labels: Record<string, Record<Language, string>> = {
      child: { en: 'Child (0-12)', hi: 'बच्चा (0-12)' },
      adult: { en: 'Adult (13-60)', hi: 'वयस्क (13-60)' },
      elderly: { en: 'Elderly (60+)', hi: 'बुज़ुर्ग (60+)' },
      yes: { en: 'Yes', hi: 'हाँ' },
      no: { en: 'No', hi: 'नहीं' },
    };
    
    addMessage(labels[answer]?.[language] || answer, 'user');
    setAssessmentData((prev) => ({ ...prev, [step]: answer }));

    // Critical: unconscious or not breathing triggers escalation
    if ((step === 'conscious' && answer === 'no') || (step === 'breathing' && answer === 'no')) {
      setAssessmentStep(null);
      await simulateTyping(
        language === 'en'
          ? "🚨 This is critical. Please call 112 immediately.\n\nWhile waiting:\n1. Check if they're breathing\n2. If not breathing, start CPR if trained\n3. Place them on their side if breathing\n4. Do NOT leave them alone\n5. Keep the airway clear"
          : "🚨 यह गंभीर है। कृपया तुरंत 112 पर कॉल करें।\n\nइंतज़ार करते हुए:\n1. जांचें कि सांस ले रहे हैं या नहीं\n2. अगर सांस नहीं, तो CPR शुरू करें (अगर जानते हों)\n3. अगर सांस ले रहे हैं तो करवट दिलाएं\n4. अकेला ना छोड़ें\n5. वायुमार्ग साफ रखें",
        { isEmergency: true }
      );
      return;
    }

    // Progress through assessment
    const nextSteps: Record<AssessmentStep, AssessmentStep | null> = {
      age: 'conscious',
      conscious: 'breathing',
      breathing: 'issue',
      issue: 'complete',
      complete: null,
    };

    const next = nextSteps[step];
    if (next === 'issue') {
      setAssessmentStep(null);
      setShowQuickActions(true);
      await simulateTyping(
        language === 'en'
          ? "Good. Now please tell me or select the main issue:"
          : "अच्छा। अब मुझे बताएं या मुख्य समस्या चुनें:"
      );
    } else if (next) {
      setAssessmentStep(next);
    }
  };

  const handleQuickAction = async (topic: string) => {
    const topicLabels: Record<string, Record<Language, string>> = {
      bleeding: { en: 'Bleeding', hi: 'खून बहना' },
      burns: { en: 'Burns', hi: 'जलना' },
      choking: { en: 'Choking', hi: 'दम घुटना' },
      chestPain: { en: 'Chest Pain', hi: 'सीने में दर्द' },
      stroke: { en: 'Stroke Signs', hi: 'लकवा लक्षण' },
      seizure: { en: 'Seizure', hi: 'दौरा' },
      poisoning: { en: 'Poisoning', hi: 'ज़हर' },
      panic: { en: 'Panic/Anxiety', hi: 'घबराहट' },
      fainting: { en: 'Fainting', hi: 'बेहोशी' },
      fracture: { en: 'Fracture/Sprain', hi: 'हड्डी टूटना' },
      dogBite: { en: 'Dog/Snake Bite', hi: 'कुत्ते/सांप का काटना' },
      allergicReaction: { en: 'Allergic Reaction', hi: 'एलर्जी' },
      heatstroke: { en: 'Heatstroke', hi: 'लू लगना' },
      asthma: { en: 'Asthma Attack', hi: 'दमा का दौरा' },
    };

    addMessage(topicLabels[topic]?.[language] || topic, 'user');

    // Handle panic specially
    if (topic === 'panic') {
      setShowBreathingGuide(true);
      await simulateTyping(
        language === 'en'
          ? "I understand you're feeling anxious. You're safe. Let's breathe together.\n\n" + t('breathingExercise', 'en')
          : "मैं समझता/समझती हूँ कि आप चिंतित महसूस कर रहे हैं। आप सुरक्षित हैं। आइए साथ में सांस लें।\n\n" + t('breathingExercise', 'hi')
      );
      return;
    }

    // Check for emergency topics
    const emergencyTopics = ['chestPain', 'stroke', 'choking', 'poisoning'];
    if (emergencyTopics.includes(topic)) {
      setShowEmergencyBanner(true);
    }

    // Get first aid guide
    const guide = getFirstAidGuide(topic, language);
    if (guide) {
      const stepsText = t('stepsToDo', language) + '\n' + guide.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
      const avoidText = '\n\n' + t('thingsToAvoid', language) + '\n' + guide.avoid.map((a) => `• ${a}`).join('\n');
      const redFlagsText = '\n\n' + t('redFlags', language) + '\n' + guide.redFlags.map((r) => `• ${r}`).join('\n');

      await simulateTyping(stepsText + avoidText + redFlagsText, {
        isEmergency: emergencyTopics.includes(topic),
      });
    }
  };

  const handleSendMessage = async (text: string) => {
    addMessage(text, 'user');

    // Safety check
    const safetyResult: SafetyCheckResult = checkForEmergency(text, language);

    if (safetyResult.isEmergency) {
      setShowEmergencyBanner(true);
      await simulateTyping(t('urgentMessage', language), { isEmergency: true });
      return;
    }

    if (safetyResult.suggestedAction === 'calming_mode') {
      setShowBreathingGuide(true);
      await simulateTyping(t('calmReassure', language) + '\n\n' + t('breathingExercise', language));
      return;
    }

    // Dhanvantri AI ML Search/Analysis
    setIsTyping(true);
    try {
        const analysis = await analyzeSymptomsAndTriage(text);
        
        const triageEmoji = analysis.level === 'High' ? '🔴' : analysis.level === 'Medium' ? '🟡' : '🟢';
        const aiResponse = language === 'en' 
            ? `${triageEmoji} **Dhanvantri AI Assessment**\n\n**Triage Level:** ${analysis.level}\n\n**Analysis:** ${analysis.explanation}\n\n**Detected Context:** ${analysis.symptoms.join(', ') || 'General'}\n\nWould you like more specific first-aid steps?`
            : `${triageEmoji} **धन्वंतरि AI आकलन**\n\n**ट्राइएज स्तर:** ${analysis.level}\n\n**विश्लेषण:** ${analysis.explanation}\n\n**समीक्षा:** ${analysis.symptoms.join(', ') || 'सामान्य'}\n\nक्या आप और अधिक विशिष्ट प्राथमिक चिकित्सा जानकारी चाहते हैं?`;

        await simulateTyping(aiResponse);
        setShowQuickActions(true);
    } catch (error) {
        console.error("Chat AI error:", error);
        setShowQuickActions(true);
        await simulateTyping(
            language === 'en'
                ? "I understand. Please select from the topics below for specific first-aid guidance, or describe the situation in more detail."
                : "मैं समझता/समझती हूँ। कृपया विशिष्ट प्राथमिक चिकित्सा मार्गदर्शन के लिए नीचे के विषयों में से चुनें, या स्थिति को और विस्तार से बताएं।"
        );
    } finally {
        setIsTyping(false);
    }
  };

  const handleReadAloud = (text: string) => {
    // TTS placeholder - ready for integration
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'en' ? 'en-IN' : 'hi-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-primary text-primary-foreground
                     shadow-lg hover:shadow-xl hover:scale-105 transition-all
                     flex items-center justify-center z-50
                     focus-accessible widget-bounce"
          aria-label="Open SwasthSewak chat"
        >
          <img src="/owl-doctor.png" alt="SwasthSewak Doctor Owl" className="w-12 h-12 object-contain drop-shadow-md transition-transform hover:scale-110" />
        </button>
      )}

      {/* Chat modal */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-full sm:h-[680px] sm:max-h-[90vh]
                        bg-chat-bg rounded-none sm:rounded-2xl shadow-2xl flex flex-col z-50 chat-enter overflow-hidden">
          <ChatHeader
            language={language}
            isDark={isDark}
            onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'hi' : 'en'))}
            onToggleTheme={() => setIsDark((d) => !d)}
            onClose={handleClose}
          />

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {showEmergencyBanner && <EmergencyBanner language={language} />}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                language={language}
                onReadAloud={handleReadAloud}
              />
            ))}

            {showLanguagePrompt && messages.length > 0 && (
              <div className="flex flex-col gap-2 my-2 message-enter">
                <div className="flex justify-start gap-3 mt-4">
                  <button 
                    onClick={() => handleLanguageSelect('en')}
                    className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 transition-colors shadow-sm focus-accessible"
                  >
                    English
                  </button>
                  <button 
                    onClick={() => handleLanguageSelect('hi')}
                    className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 transition-colors shadow-sm focus-accessible"
                  >
                    हिंदी
                  </button>
                </div>
              </div>
            )}

            {showEmergencyQuestion && messages.length > 0 && !showLanguagePrompt && (
              <EmergencyQuestion
                language={language}
                onEmergency={handleEmergency}
                onNotEmergency={handleNotEmergency}
              />
            )}

            {assessmentStep && (
              <AssessmentQuestions
                language={language}
                step={assessmentStep}
                onAnswer={handleAssessmentAnswer}
              />
            )}

            {showBreathingGuide && <BreathingGuide language={language} />}

            {isTyping && <TypingIndicator language={language} />}

            {showQuickActions && !isTyping && !assessmentStep && (
              <QuickActions language={language} onSelect={handleQuickAction} />
            )}

            <div ref={messagesEndRef} />
          </div>

          <ChatInput language={language} onSend={handleSendMessage} disabled={isTyping} />

          {/* Safety disclaimer footer */}
          <div className="px-4 py-2 bg-muted/50 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              ⚕️ {t('disclaimer', language)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
