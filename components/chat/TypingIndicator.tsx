import { Language, t } from '@/lib/translations';

interface TypingIndicatorProps {
  language: Language;
}

export function TypingIndicator({ language }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start mb-4 message-enter">
      <div className="bg-chat-bot-bubble border border-border rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">SS</span>
          </div>
          <span className="text-sm text-muted-foreground">{t('typing', language)}</span>
        </div>
        <div className="flex gap-1.5 mt-3">
          <span className="w-2.5 h-2.5 bg-muted-foreground/50 rounded-full typing-dot" />
          <span className="w-2.5 h-2.5 bg-muted-foreground/50 rounded-full typing-dot" />
          <span className="w-2.5 h-2.5 bg-muted-foreground/50 rounded-full typing-dot" />
        </div>
      </div>
    </div>
  );
}
