import { X, Moon, Sun, Languages } from 'lucide-react';
import { Language, t } from '@/lib/translations';

interface ChatHeaderProps {
  language: Language;
  isDark: boolean;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onClose: () => void;
}

export function ChatHeader({ language, isDark, onToggleLanguage, onToggleTheme, onClose }: ChatHeaderProps) {
  return (
    <div className="bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between rounded-t-2xl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
          <img src="/owl-doctor.png" alt="Owl" className="w-full h-full object-contain p-0.5" />
        </div>
        <div className="text-black">
          <h2 className="font-bold text-lg">{t('appName', language)}</h2>
          <p className="text-xs opacity-90">{t('tagline', language)}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 text-black">
        {/* Language toggle */}
        <button
          onClick={onToggleLanguage}
          className="p-2.5 rounded-lg hover:bg-primary-foreground/10 transition-colors focus-accessible"
          aria-label={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
        >
          <Languages className="w-5 h-5" />
        </button>
        

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2.5 rounded-lg hover:bg-primary-foreground/10 transition-colors focus-accessible"
          aria-label={t('close', language)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
