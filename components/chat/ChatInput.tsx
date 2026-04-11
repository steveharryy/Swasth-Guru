import { useState, KeyboardEvent } from 'react';
import { Send, Mic } from 'lucide-react';
import { Language, t } from '@/lib/translations';

interface ChatInputProps {
  language: Language;
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ language, onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    if (isRecording) return; // Wait for current session to end
    
    const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
    
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-IN' : 'hi-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="flex gap-3 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('typeMessage', language)}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-background border border-input rounded-xl px-4 py-3
                     text-lg placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed
                     min-h-[52px] max-h-[120px]"
          style={{ lineHeight: '1.5' }}
        />
          <button
            onClick={toggleRecording}
            disabled={disabled}
            className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all focus-accessible active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            aria-label="Dictate Message"
          >
            <Mic className="w-6 h-6" />
          </button>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary text-primary-foreground
                       flex items-center justify-center
                       hover:brightness-110 transition-all
                       focus-accessible active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('send', language)}
          >
            <Send className="w-6 h-6" />
          </button>
      </div>
    </div>
  );
}
