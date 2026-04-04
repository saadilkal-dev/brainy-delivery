import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, Lightbulb, ArrowRight, Send, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockMeetingNotes } from '@/api/mockMeetingNotes';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { AIMessage, UserMessage } from '@/components/interview/AIMessage';
import { ApprovalCard } from '@/components/interview/ApprovalCard';
import { PlanSummaryPanel } from '@/components/interview/PlanSummaryPanel';

// ─── Question answer options per question index ─────────────────────────────

const ANSWER_OPTIONS: string[][] = [
  ['Client portal / dealer-facing', 'Internal tool', 'SaaS product', 'Customer-facing app'],
  ['Fast time-to-market', 'Seamless ERP integration', 'High reliability & uptime', 'Exceptional UX'],
  ['Azure AD SSO required', 'REST API integrations only', 'On-premise deployment', 'No hard constraints'],
  ['Small team (2–3 devs)', 'Mid team (4–6 devs)', 'Large team (7+)', 'Team TBD'],
];

// ─── Meeting signal card ─────────────────────────────────────────────────────

function MeetingCard({ meeting }: { meeting: typeof mockMeetingNotes[0] }) {
  return (
    <div className="bg-white rounded-xl border border-black/6 p-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center mt-0.5">
          <Calendar className="w-3.5 h-3.5 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-800 leading-snug">{meeting.title}</div>
          <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{meeting.date}</div>
          <div className="mt-1.5 space-y-1">
            {meeting.keyPoints.slice(0, 2).map((point, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-gray-500">
                <span className="text-violet-400 mt-0.5 shrink-0">·</span>
                <span className="leading-snug">{point}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
            <Users className="w-3 h-3" />
            {meeting.attendees.length} attendees
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AIInterview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useInterviewSession(id ?? '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [freeText, setFreeText] = useState('');

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  function handleOptionSelect(opt: string) {
    if (session.isStreaming) return;
    session.submitAnswer(opt);
  }

  function handleFreeTextSend() {
    const text = freeText.trim();
    if (!text || session.isStreaming) return;
    setFreeText('');
    session.submitAnswer(text);
  }

  const showOptions =
    session.phase === 'questioning' &&
    !session.isStreaming &&
    session.messages.length > 0 &&
    session.messages[session.messages.length - 1]?.role === 'ai';

  const currentOptions = ANSWER_OPTIONS[session.questionIndex] ?? [];

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-[#f4f3f0] flex">
      {/* ── Left: conversation ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/6 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">AI Discovery Interview</span>
            <span className="ml-auto text-xs text-gray-400 font-mono">
              {session.phase === 'detecting' && 'Meeting analysis'}
              {session.phase === 'questioning' && `Question ${session.questionIndex + 1} of 4`}
              {session.phase === 'proposing' && 'Generating plan...'}
              {session.phase === 'reviewing' && 'Review modules'}
              {session.phase === 'complete' && 'Plan complete'}
            </span>
          </div>
        </div>

        {/* Conversation thread */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {/* Detection phase */}
          {session.phase === 'detecting' && (
            <>
              <AIMessage
                content={`I found ${mockMeetingNotes.length} recent meetings with context on this project. Let me use these to ask you a few focused questions before proposing a delivery plan.`}
              />
              <div className="pl-10 space-y-2">
                {mockMeetingNotes.map((m) => (
                  <MeetingCard key={m.id} meeting={m} />
                ))}
              </div>
              <div className="pl-10">
                <button
                  onClick={session.startInterview}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
                >
                  Let's start <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          {/* AI + user messages */}
          {session.messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'ai' ? (
                <AIMessage content={msg.content} streaming={msg.streaming} />
              ) : (
                <UserMessage content={msg.content} />
              )}
            </div>
          ))}

          {/* Module approval cards (inline after AI proposes) */}
          {(session.phase === 'reviewing' || session.phase === 'complete') &&
            session.modules.length > 0 && (
              <div className="pl-10 space-y-2">
                {session.modules.map((mod) => (
                  <ApprovalCard
                    key={mod.id}
                    module={mod}
                    onDecide={session.decideModule}
                    onEdit={session.editModule}
                  />
                ))}

                {session.allReviewed && session.phase === 'reviewing' && (
                  <button
                    onClick={session.finishReview}
                    className="w-full mt-2 py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-sm font-medium hover:bg-violet-100 transition-colors"
                  >
                    Finalize plan →
                  </button>
                )}
              </div>
            )}

          {/* Kickoff button */}
          {session.phase === 'complete' && (
            <div className="pl-10">
              <button
                onClick={() => navigate(`/consultant/${id}/journey`)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Rocket className="w-4 h-4" />
                Kick off project — enter 3D map
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Answer options + free text input */}
        {session.phase === 'questioning' && (
          <div className="px-6 py-4 border-t border-black/6 bg-white/60 backdrop-blur-sm space-y-3">
            {showOptions && currentOptions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    disabled={session.isStreaming}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                      'border-black/10 bg-white text-gray-700',
                      'hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFreeTextSend()}
                placeholder="Or type a custom answer..."
                disabled={session.isStreaming}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-xl border border-black/10 bg-white text-sm text-gray-900',
                  'placeholder:text-gray-400 focus:outline-none focus:border-violet-400',
                  'disabled:opacity-50',
                )}
              />
              <button
                onClick={handleFreeTextSend}
                disabled={!freeText.trim() || session.isStreaming}
                className="px-3 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Plan summary ── */}
      <div className="w-72 shrink-0 border-l border-black/6 bg-white/40 backdrop-blur-sm p-4 overflow-y-auto">
        <PlanSummaryPanel
          modules={session.modules}
          answers={session.userAnswers}
          phase={session.phase}
        />
      </div>
    </div>
  );
}
