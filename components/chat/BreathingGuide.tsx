import { Language, t } from '@/lib/translations';

interface BreathingGuideProps {
  language: Language;
}

export function BreathingGuide({ language }: BreathingGuideProps) {
  return (
    <div className="bg-calm/10 border-2 border-calm/30 rounded-2xl p-6 mb-4 message-enter">
      <div className="flex flex-col items-center">
        {/* Breathing animation circle */}
        <div className="relative w-32 h-32 mb-4">
          <div className="absolute inset-0 rounded-full bg-calm/20 breathing-guide" />
          <div className="absolute inset-4 rounded-full bg-calm/30 breathing-guide" style={{ animationDelay: '0.5s' }} />
          <div className="absolute inset-8 rounded-full bg-calm/40 breathing-guide" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-calm font-bold text-lg">
              {language === 'en' ? 'Breathe' : 'सांस लें'}
            </span>
          </div>
        </div>

        <p className="text-foreground font-medium text-lg text-center mb-3">
          {t('calmReassure', language)}
        </p>
        
        <p className="text-muted-foreground text-center">
          {t('breathingExercise', language)}
        </p>
      </div>
    </div>
  );
}
