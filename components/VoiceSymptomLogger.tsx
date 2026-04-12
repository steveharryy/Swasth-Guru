'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Languages, Volume2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Add SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

interface VoiceSymptomLoggerProps {
  onSymptomDetected: (symptom: string) => void;
  availableSymptoms: string[];
  currentLanguage: 'en-US' | 'hi-IN';
  onLanguageChange: (lang: 'en-US' | 'hi-IN') => void;
}


// Synonyms mapping for better matching (especially for Hindi)
const SYMPTOM_SYNONYMS: Record<string, string[]> = {
  'Headache': ['headache', 'head pain', 'sar dard', 'sirdard', 'sir mein dard', 'sir dard', 'headacheing', 'aching head'],
  'Adult Fever': ['fever', 'bukhaar', 'body hot', 'tapmaan', 'bukhar', 'thandi lag rahi', 'feverish', 'high temperature'],
  'Stomach pain': ['stomach pain', 'pet dard', 'abdominal pain', 'pet kharab', 'acidity', 'gas', 'stomach ache', 'digestion'],
  'Chest Problems': ['chest pain', 'seene mein dard', 'dil mein dard', 'heart pain', 'breathless', 'seene mey dard', 'chest pressure'],
  'Skin rash': ['rash', 'khujli', 'skin problem', 'itching', 'daane', 'khujli ho rahi', 'redness', 'eczema'],
  'Nausea': ['nausea', 'vomit', 'ultee', 'जी मिचलाना', 'vomiting', 'puking', 'feeling sick'],
  'Body ache': ['body ache', 'badan dard', 'muscle pain', 'pain in body', 'body pain', 'thakan'],
  'Cough': ['cough', 'khansi', 'khasi', 'coughing', 'sore throat'],
  'Back pain': ['back pain', 'peeth dard', 'kamar dard', 'spine pain', 'lower back'],
  'Dental pain': ['toothache', 'daant dard', 'dental pain', 'teeth pain', 'molar pain'],
  'Joint pain': ['joint pain', 'ghutno mein dard', 'ghutna dard', 'knee pain', 'arthritis', 'joint ache'],
  'Eye problems': ['eye pain', 'aankh mein dard', 'vision', 'red eye', 'itchy eyes'],
};

export function VoiceSymptomLogger({ 
  onSymptomDetected, 
  availableSymptoms, 
  currentLanguage, 
  onLanguageChange 
}: VoiceSymptomLoggerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition() as SpeechRecognition;

      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = currentLanguage;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const resultText = event.results[i][0].transcript.toLowerCase();
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + ' ' + resultText);
            analyzeSpeech(resultText);
          } else {
            interimTranscript += resultText;
            // Also analyze interim results for faster sensing
            if (interimTranscript.length > 3) analyzeSpeech(interimTranscript);
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) recognitionRef.current.start();
      };
    }

    return () => {
       if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [currentLanguage]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setDetectedItems([]);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const analyzeSpeech = (text: string) => {
    const textLower = text.toLowerCase();
    const newMatches: string[] = [];

    // Check against synonyms
    Object.entries(SYMPTOM_SYNONYMS).forEach(([officialName, synonyms]) => {
      if (synonyms.some(syn => textLower.includes(syn.toLowerCase()))) {
        if (!detectedItems.includes(officialName)) {
          newMatches.push(officialName);
          onSymptomDetected(officialName);
        }
      }
    });

    if (newMatches.length > 0) {
      setDetectedItems(prev => [...prev, ...newMatches]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.03)] space-y-8 overflow-hidden relative">
      {/* Sound Wave Animation */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center -z-10"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.15, 0.08, 0.15],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
                className="absolute w-[500px] h-[500px] rounded-full border border-primary/40"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            Dhanvantari Voice
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
            Real-time Neural Symptom Mapping
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => onLanguageChange(currentLanguage === 'en-US' ? 'hi-IN' : 'en-US')}
          className="rounded-xl border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-black tracking-widest gap-2 hover:bg-slate-100"
        >
          <Languages className="w-4 h-4" />
          {currentLanguage === 'en-US' ? 'HINDI' : 'ENGLISH'}
        </Button>
      </div>

      <div className="flex flex-col items-center gap-8 py-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleListening}
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
            isListening 
              ? 'bg-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.3)]' 
              : 'bg-primary shadow-[0_0_50px_rgba(37,99,235,0.2)]'
          }`}
        >
          {isListening ? (
            <MicOff className="w-12 h-12 text-white" />
          ) : (
            <Mic className="w-12 h-12 text-white" />
          )}
        </motion.button>

        <div className="text-center space-y-4 w-full">
          <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">
            {isListening ? 'Listening for anomalies...' : 'Tap microphone to speak symptoms'}
          </p>
          
          <div className="h-12 flex items-center justify-center px-8 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-lg font-bold text-slate-800 italic truncate max-w-lg">
              {transcript || (isListening ? '...' : 'Speak now in ' + (currentLanguage === 'en-US' ? 'English' : 'Hindi'))}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Detected in real-time</p>
        <div className="flex flex-wrap gap-2 min-h-12">
          {detectedItems.map((item, idx) => (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={idx}
            >
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 font-black uppercase text-[9px] tracking-widest">
                {item}
              </Badge>
            </motion.div>
          ))}
          {detectedItems.length === 0 && (
            <span className="text-[10px] font-bold text-slate-200 italic">No medical flags detected yet...</span>
          )}
        </div>
      </div>
    </div>
  );
}

