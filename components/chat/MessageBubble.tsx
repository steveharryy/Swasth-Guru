import { Language, t } from '@/lib/translations';
import { Volume2 } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isEmergency?: boolean;
  hasDisclaimer?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  language: Language;
  onReadAloud?: (text: string) => void;
}

export function MessageBubble({ message, language, onReadAloud }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2 message-enter">
        <div className="bg-muted text-muted-foreground px-4 py-2 rounded-full text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 message-enter`}>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 ${
          isUser
            ? 'bg-chat-user-bubble text-primary-foreground rounded-br-md'
            : message.isEmergency
            ? 'bg-chat-emergency-bg border-2 border-chat-emergency-border rounded-bl-md'
            : 'bg-chat-bot-bubble border border-border rounded-bl-md shadow-sm'
        }`}
      >
        {/* Bot avatar for assistant messages */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm shadow-border">
              <img src="/owl-doctor.png" alt="Owl" className="w-full h-full object-contain p-0.5" />
            </div>
            <span className="text-sm font-medium text-foreground">
              {language === 'en' ? 'SwasthSewak' : 'स्वास्थ्य सेवक'}
            </span>
            {onReadAloud && (
              <button
                onClick={() => onReadAloud(message.content)}
                className="ml-auto p-1.5 rounded-full hover:bg-muted transition-colors focus-accessible"
                aria-label={t('readAloud', language)}
              >
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Message content with formatted text */}
        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? '' : 'text-foreground'}`}>
          {message.content.split('\n').map((line, idx) => {
            // Style step numbers
            if (line.match(/^[1-9]\./)) {
              return (
                <div key={idx} className="flex gap-2 my-1">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {line.charAt(0)}
                  </span>
                  <span>{line.substring(2).trim()}</span>
                </div>
              );
            }
            // Style checkmarks
            if (line.startsWith('✅')) {
              return <div key={idx} className="font-semibold text-success mt-3 mb-1">{line}</div>;
            }
            // Style avoid/don't
            if (line.startsWith('❌')) {
              return <div key={idx} className="font-semibold text-destructive mt-3 mb-1">{line}</div>;
            }
            // Style red flags
            if (line.startsWith('🚨')) {
              return <div key={idx} className="font-semibold text-warning mt-3 mb-1">{line}</div>;
            }
            // Style bullet points
            if (line.startsWith('•') || line.startsWith('→')) {
              return <div key={idx} className="ml-4 my-0.5">{line}</div>;
            }
            return <div key={idx}>{line}</div>;
          })}
        </div>

        {/* Disclaimer */}
        {message.hasDisclaimer && !isUser && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-sm text-muted-foreground italic">
              ⚕️ {t('disclaimer', language)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
