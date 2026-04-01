import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, Sparkles, FileText, GitBranch,
  ChevronRight, PanelRightOpen, PanelRightClose,
  Clock, Download, Copy, Check, Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#f3f0ff',
    primaryTextColor: '#1a1a2e',
    primaryBorderColor: '#7c3aed',
    lineColor: '#7c3aed',
    secondaryColor: '#f8f9fa',
    tertiaryColor: '#ecfdf5',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '13px',
  },
  flowchart: { curve: 'basis', padding: 16 },
  gantt: {
    titleTopMargin: 16,
    barHeight: 24,
    barGap: 6,
    topPadding: 40,
    leftPadding: 60,
    numberSectionStyles: 4,
  },
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  artifact?: {
    type: 'mermaid' | 'plan' | 'timeline';
    title: string;
    content: string;
  };
  thinking?: string[];
  timestamp?: number;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hey! I'm your Delivery Brain — ready to co-create your delivery plan. I can work with meeting notes, estimation sheets, or we can start from scratch.\n\nWhat would you like to do?",
    suggestions: [
      'Paste meeting notes',
      'Upload estimation sheet',
      'Start from scratch',
      'Review existing plan',
    ],
    timestamp: Date.now() - 60000,
  },
];

const MOCK_RESPONSES: Record<string, Message> = {
  'Start from scratch': {
    id: '',
    role: 'assistant',
    content: "Great, let's build this together. I'll ask some questions to understand the project scope, then generate a plan we can refine.\n\nFirst — what's the core product or feature you're delivering? Give me a one-liner.",
    suggestions: [
      'Web application with user auth',
      'Mobile app MVP',
      'API platform + integrations',
      'Let me describe it',
    ],
  },
  'Web application with user auth': {
    id: '',
    role: 'assistant',
    content: "Got it — web app with auth. Let me think through the major workstreams...",
    thinking: [
      'Analyzing common web app architecture patterns...',
      'Identifying core modules: Auth, Frontend, API, Database, Deployment...',
      'Estimating complexity and dependencies...',
    ],
    artifact: {
      type: 'mermaid',
      title: 'Delivery Architecture',
      content: `graph TD
    A[Project Setup] --> B[Authentication]
    A --> C[Database Schema]
    B --> D[Frontend Core]
    C --> D
    D --> E[Feature Modules]
    E --> F[Integration Testing]
    C --> G[API Layer]
    G --> E
    F --> H[Staging Deploy]
    H --> I[UAT & Feedback]
    I --> J[Production Launch]

    style A fill:#f3f0ff,stroke:#7c3aed,color:#1a1a2e
    style B fill:#f3f0ff,stroke:#7c3aed,color:#1a1a2e
    style D fill:#f3f0ff,stroke:#7c3aed,color:#1a1a2e
    style J fill:#ecfdf5,stroke:#059669,color:#1a1a2e`,
    },
    suggestions: [
      'Add more detail to Auth module',
      'What tech stack do you recommend?',
      'Add a CI/CD pipeline stage',
      'Generate timeline estimates',
    ],
  },
  'Paste meeting notes': {
    id: '',
    role: 'assistant',
    content: "Perfect — paste your meeting notes or transcript below and I'll extract:\n\n• **Decisions** made\n• **Action items** and owners\n• **Blockers** or risks identified\n• **Requirements** for the delivery plan\n\nI'll then propose modules and a timeline based on what I find.",
  },
  'Generate timeline estimates': {
    id: '',
    role: 'assistant',
    content: "Based on a web app with auth, here's my estimated timeline. These assume a team of 2-3 developers:",
    artifact: {
      type: 'timeline',
      title: 'Delivery Timeline',
      content: `gantt
    title Delivery Roadmap
    dateFormat  YYYY-MM-DD
    section Setup
    Project Setup & Env        :done, setup, 2026-04-01, 3d
    Database Schema Design     :done, db, 2026-04-01, 4d
    section Core
    Authentication Module      :active, auth, 2026-04-04, 5d
    API Layer                  :api, 2026-04-07, 7d
    Frontend Core              :fe, 2026-04-09, 8d
    section Features
    Feature Modules            :feat, 2026-04-17, 10d
    section QA
    Integration Testing        :test, 2026-04-28, 5d
    UAT & Feedback             :uat, 2026-05-05, 5d
    section Launch
    Production Deploy          :launch, 2026-05-12, 2d`,
    },
    suggestions: [
      'Adjust timeline — we have 4 developers',
      'Add buffer for client review',
      'What are the key risks?',
      'Finalize this plan',
    ],
  },
};

function ThinkingIndicator({ steps }: { steps: string[] }) {
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    if (visibleSteps < steps.length) {
      const timer = setTimeout(() => setVisibleSteps(v => v + 1), 800);
      return () => clearTimeout(timer);
    }
  }, [visibleSteps, steps.length]);

  return (
    <div className="space-y-2 mb-3 py-2 px-3 rounded-lg bg-primary/[0.03] border border-primary/8">
      {steps.slice(0, visibleSteps).map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-xs text-primary/70"
        >
          <Sparkles className="h-3 w-3 animate-pulse-soft" />
          <span>{step}</span>
          <Check className="h-3 w-3 text-success/60 ml-auto" />
        </motion.div>
      ))}
      {visibleSteps < steps.length && (
        <div className="flex items-center gap-1.5 pl-0.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-thinking-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MermaidDiagram({ chart, id }: { chart: string; id: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const uniqueId = `mermaid-${id}-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(uniqueId, chart);
        if (!cancelled) {
          setSvg(rendered);
          setError('');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to render diagram');
          const orphan = document.getElementById(`dmermaid-${id}-${Date.now()}`);
          orphan?.remove();
        }
      }
    };
    render();
    return () => { cancelled = true; };
  }, [chart, id]);

  if (error) {
    return (
      <div className="p-4">
        <pre className="text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-4 border border-border">
          {chart}
        </pre>
        <p className="text-xs text-destructive/60 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center p-6 min-h-[300px] [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function ArtifactPanel({ artifact, artifactHistory }: {
  artifact: Message['artifact'];
  artifactHistory: Message['artifact'][];
}) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  if (!artifact) return null;

  const isMermaid = artifact.type === 'mermaid' || artifact.type === 'timeline';
  const versionNum = artifactHistory.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/20">
        <GitBranch className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-medium text-foreground flex-1 truncate">{artifact.title}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/8 text-primary/70 font-mono">
          v{versionNum}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border px-4">
        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            'text-xs font-medium px-3 py-2 border-b-2 transition-colors',
            activeTab === 'preview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={cn(
            'text-xs font-medium px-3 py-2 border-b-2 transition-colors',
            activeTab === 'code' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Source
        </button>
        <div className="flex-1" />
        <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground" title="Copy">
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'preview' ? (
          isMermaid ? (
            <MermaidDiagram chart={artifact.content} id={artifact.title.replace(/\s/g, '-')} />
          ) : (
            <div className="p-4">
              <pre className="text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {artifact.content}
              </pre>
            </div>
          )
        ) : (
          <div className="p-4">
            <pre className="text-xs font-mono text-foreground/70 leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-4 border border-border">
              {artifact.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoCreate() {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showArtifact, setShowArtifact] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const latestArtifact = [...messages].reverse().find(m => m.artifact)?.artifact;
  const artifactHistory = messages.filter(m => m.artifact).map(m => m.artifact!);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const mockResponse = MOCK_RESPONSES[text];
    const delay = mockResponse?.thinking ? 2500 : 1200;

    setTimeout(() => {
      const response: Message = mockResponse
        ? { ...mockResponse, id: (Date.now() + 1).toString(), timestamp: Date.now() }
        : {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I understand. Let me think about "${text}" in the context of your delivery plan.\n\nCould you elaborate a bit more? I want to make sure I capture this accurately for the plan.`,
            suggestions: ['Add this as a requirement', 'Show updated plan', 'Continue planning'],
            timestamp: Date.now(),
          };

      setIsTyping(false);
      setMessages(prev => [...prev, response]);
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Chat pane */}
      <div className={cn(
        'flex flex-col transition-all duration-300 bg-background',
        showArtifact && latestArtifact ? 'w-1/2 border-r border-border' : 'w-full max-w-3xl mx-auto'
      )}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="shrink-0 mt-1">
                    <div className="p-1.5 rounded-xl bg-primary/8 border border-primary/10">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}

                <div className={cn(
                  'max-w-[80%]',
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm'
                    : ''
                )}>
                  {msg.thinking && <ThinkingIndicator steps={msg.thinking} />}

                  <div className={cn(
                    'text-sm leading-relaxed whitespace-pre-wrap',
                    msg.role === 'assistant' && 'text-foreground/85'
                  )}>
                    {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>

                  {/* Suggestion chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.suggestions.map(suggestion => (
                        <motion.button
                          key={suggestion}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => handleSend(suggestion)}
                          className="text-xs px-3 py-1.5 rounded-full border border-primary/15 text-primary/80 hover:bg-primary/8 hover:text-primary hover:border-primary/25 transition-all font-medium"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Artifact indicator */}
                  {msg.artifact && (
                    <button
                      onClick={() => setShowArtifact(true)}
                      className="flex items-center gap-2 mt-3 text-xs text-primary/70 hover:text-primary transition-colors group bg-primary/[0.04] rounded-lg px-3 py-2 border border-primary/10 hover:border-primary/20"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span className="font-medium">{msg.artifact.title}</span>
                      <span className="text-primary/40 text-[10px] font-mono ml-1">{msg.artifact.type}</span>
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform ml-auto" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="p-1.5 rounded-xl bg-primary/8 border border-primary/10">
                <Brain className="h-4 w-4 text-primary animate-pulse-soft" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary/30 animate-thinking-dot"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-white p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to plan, paste meeting notes, or ask a question..."
                className="w-full resize-none rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 min-h-[48px] max-h-[160px] transition-all"
                rows={1}
                onInput={e => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                }}
              />
            </div>
            <Button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="h-12 w-12 rounded-xl shrink-0 shadow-sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-muted-foreground/30">
              Delivery Brain co-creates plans with you
            </p>
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted-foreground/30 font-mono">
              ⌘K for commands
            </kbd>
          </div>
        </div>
      </div>

      {/* Artifact pane */}
      {latestArtifact && (
        <>
          <button
            onClick={() => setShowArtifact(!showArtifact)}
            className={cn(
              'self-start mt-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground z-10',
              !showArtifact && 'absolute right-4'
            )}
            title={showArtifact ? 'Hide artifact' : 'Show artifact'}
          >
            {showArtifact ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </button>

          <AnimatePresence>
            {showArtifact && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '50%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <ArtifactPanel artifact={latestArtifact} artifactHistory={artifactHistory} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
