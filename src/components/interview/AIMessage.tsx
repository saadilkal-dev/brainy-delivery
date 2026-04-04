import { cn } from '@/lib/utils';

interface AIMessageProps {
  content: string;
  streaming?: boolean;
}

export function AIMessage({ content, streaming }: AIMessageProps) {
  return (
    <div className="flex gap-3">
      {/* AI avatar */}
      <div className="shrink-0 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center mt-0.5">
        <span className="text-white text-[10px] font-bold font-mono">AI</span>
      </div>

      <div
        className={cn(
          'bg-white rounded-xl rounded-tl-sm px-4 py-3 shadow-sm border border-black/5',
          'text-sm text-gray-800 leading-relaxed max-w-[85%]',
          'whitespace-pre-wrap',
        )}
      >
        {content}
        {streaming && (
          <span className="inline-flex gap-0.5 ml-1 align-middle">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="bg-violet-600 text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

interface AnswerOptionsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export function AnswerOptions({ options, onSelect, disabled }: AnswerOptionsProps) {
  return (
    <div className="flex flex-wrap gap-2 pl-10">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          disabled={disabled}
          className={cn(
            'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
            'border-black/10 bg-white text-gray-700',
            'hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
