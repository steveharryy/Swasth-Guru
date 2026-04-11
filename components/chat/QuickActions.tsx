import { Language, t } from '@/lib/translations';
import { 
  Droplets, Flame, Wind, Heart, Brain, 
  Zap, Skull, Frown, AlertCircle, Bone,
  Dog, Thermometer, CloudSun
} from 'lucide-react';

interface QuickActionsProps {
  language: Language;
  onSelect: (topic: string) => void;
}

const quickActions = [
  { key: 'bleeding', icon: Droplets, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { key: 'burns', icon: Flame, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { key: 'choking', icon: Wind, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { key: 'chestPain', icon: Heart, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  { key: 'stroke', icon: Brain, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { key: 'seizure', icon: Zap, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { key: 'poisoning', icon: Skull, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { key: 'panic', icon: Frown, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  { key: 'fainting', icon: AlertCircle, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { key: 'fracture', icon: Bone, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { key: 'dogBite', icon: Dog, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  { key: 'allergicReaction', icon: Thermometer, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  { key: 'heatstroke', icon: CloudSun, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { key: 'asthma', icon: Wind, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
];

export function QuickActions({ language, onSelect }: QuickActionsProps) {
  return (
    <div className="mb-4">
      <p className="text-sm text-muted-foreground mb-2 px-1">
        {language === 'en' ? 'Quick help for:' : 'इसके लिए तुरंत मदद:'}
      </p>
      <div className="flex flex-wrap gap-2">
        {quickActions.map(({ key, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-base
                       ${color} hover:brightness-95 dark:hover:brightness-110 transition-all
                       focus-accessible active:scale-95 min-h-touch`}
          >
            <Icon className="w-5 h-5" />
            <span>{t(key as keyof typeof import('@/lib/translations').translations, language)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
