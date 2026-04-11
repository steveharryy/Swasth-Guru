import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Language, t } from '@/lib/translations';

interface EmergencyQuestionProps {
  language: Language;
  onEmergency: () => void;
  onNotEmergency: () => void;
}

export function EmergencyQuestion({ language, onEmergency, onNotEmergency }: EmergencyQuestionProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-4 message-enter">
      <p className="text-xl font-semibold text-foreground mb-5 text-center">
        {t('isEmergency', language)}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onEmergency}
          className="flex-1 flex items-center justify-center gap-3 bg-destructive text-destructive-foreground 
                     py-5 px-6 rounded-xl font-bold text-xl hover:brightness-110 transition-all
                     focus-accessible active:scale-95 min-h-[72px] emergency-pulse"
        >
          <AlertTriangle className="w-7 h-7" />
          <span>{t('emergency', language)}</span>
        </button>
        
        <button
          onClick={onNotEmergency}
          className="flex-1 flex items-center justify-center gap-3 bg-success text-success-foreground 
                     py-5 px-6 rounded-xl font-bold text-xl hover:brightness-110 transition-all
                     focus-accessible active:scale-95 min-h-[72px]"
        >
          <CheckCircle className="w-7 h-7" />
          <span>{t('notEmergency', language)}</span>
        </button>
      </div>
    </div>
  );
}
