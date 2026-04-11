import { Language, t } from '@/lib/translations';

export type AssessmentStep = 'age' | 'conscious' | 'breathing' | 'issue' | 'complete';

interface AssessmentQuestionsProps {
  language: Language;
  step: AssessmentStep;
  onAnswer: (answer: string, step: AssessmentStep) => void;
}

export function AssessmentQuestions({ language, step, onAnswer }: AssessmentQuestionsProps) {
  if (step === 'complete') return null;

  const questions: Record<AssessmentStep, { question: string; options: { label: string; value: string }[] }> = {
    age: {
      question: t('ageGroup', language),
      options: [
        { label: t('child', language), value: 'child' },
        { label: t('adult', language), value: 'adult' },
        { label: t('elderly', language), value: 'elderly' },
      ],
    },
    conscious: {
      question: t('isConscious', language),
      options: [
        { label: t('yes', language), value: 'yes' },
        { label: t('no', language), value: 'no' },
      ],
    },
    breathing: {
      question: t('breathingNormal', language),
      options: [
        { label: t('yes', language), value: 'yes' },
        { label: t('no', language), value: 'no' },
      ],
    },
    issue: {
      question: t('mainIssue', language),
      options: [],
    },
    complete: {
      question: '',
      options: [],
    },
  };

  const current = questions[step];

  return (
    <div className="bg-secondary/50 border border-border rounded-2xl p-5 mb-4 message-enter">
      <p className="text-lg font-semibold text-foreground mb-4">{current.question}</p>
      
      {current.options.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {current.options.map((option) => (
            <button
              key={option.value}
              onClick={() => onAnswer(option.value, step)}
              className="flex-1 min-w-[120px] bg-card hover:bg-primary hover:text-primary-foreground
                         border-2 border-border hover:border-primary
                         py-4 px-5 rounded-xl font-semibold text-lg transition-all
                         focus-accessible active:scale-95"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
