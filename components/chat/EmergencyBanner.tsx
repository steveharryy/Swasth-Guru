import { Phone, AlertTriangle } from 'lucide-react';
import { Language, t } from '@/lib/translations';

interface EmergencyBannerProps {
  language: Language;
  onDismiss?: () => void;
}

export function EmergencyBanner({ language }: EmergencyBannerProps) {
  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="bg-chat-emergency-bg border-2 border-chat-emergency-border rounded-xl p-4 mb-4 message-enter">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center flex-shrink-0 emergency-pulse">
          <AlertTriangle className="w-5 h-5 text-destructive-foreground" />
        </div>
        <p className="text-foreground font-medium text-lg leading-snug">
          {t('urgentMessage', language)}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => handleCall('112')}
          className="flex-1 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground 
                     py-4 px-6 rounded-xl font-bold text-lg hover:brightness-110 transition-all
                     focus-accessible active:scale-95 min-h-touch emergency-pulse"
        >
          <Phone className="w-6 h-6" />
          {t('emergencyServices', language)}
        </button>
        
        <button
          onClick={() => handleCall('108')}
          className="flex-1 flex items-center justify-center gap-2 bg-warning text-warning-foreground 
                     py-4 px-6 rounded-xl font-bold text-lg hover:brightness-110 transition-all
                     focus-accessible active:scale-95 min-h-touch"
        >
          <Phone className="w-6 h-6" />
          {t('ambulance', language)}
        </button>
      </div>
    </div>
  );
}
