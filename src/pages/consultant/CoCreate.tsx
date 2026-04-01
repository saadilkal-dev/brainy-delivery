import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, Sparkles, FileText, GitBranch,
  ChevronRight, Copy, Check, ArrowRight,
  Plus, GripVertical, Edit3, CheckCircle2,
  AlertTriangle, Clock, Zap, RotateCcw,
  ClipboardList, Wand2, FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import mermaid from 'mermaid';
import { streamChat, parseArtifacts, type ChatMessage, type ParsedArtifact } from '@/api/claude';

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
  gantt: { barHeight: 24, barGap: 6, topPadding: 40, sidePadding: 60 },
});

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 'brief' | 'extracting' | 'modules' | 'finalize';

interface ExtractedModule {
  id: string;
  name: string;
  description: string;
  owner: string;
  estimated_days: number;
  status: 'not_started' | 'in_progress' | 'complete' | 'blocked';
  editing?: boolean;
}

interface ArtifactState {
  type: 'mermaid' | 'timeline' | 'modules';
  title: string;
  content: string;
}

interface FollowUpMessage {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

// ─── Extraction steps for Phase 2 animation ─────────────────────────────────

const EXTRACTION_STEPS = [
  'Reading project brief...',
  'Identifying delivery modules...',
  'Mapping dependencies & risks...',
  'Estimating timelines...',
  'Generating architecture diagram...',
  'Building delivery plan...',
];

// ─── Phase bar ───────────────────────────────────────────────────────────────

const PHASES: { id: Phase; label: string; num: number }[] = [
  { id: 'brief', label: 'Brief', num: 1 },
  { id: 'extracting', label: 'Extracting', num: 2 },
  { id: 'modules', label: 'Modules', num: 3 },
  { id: 'finalize', label: 'Finalize', num: 4 },
];

function PhaseBar({ current }: { current: Phase }) {
  const currentIdx = PHASES.findIndex(p => p.id === current);
  return (
    <div className="flex items-center gap-0 px-6 py-3 border-b border-border bg-white/80 backdrop-blur-sm">
      {PHASES.map((phase, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={phase.id} className="flex items-center">
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              active ? 'bg-primary/10 text-primary' : done ? 'text-success' : 'text-muted-foreground/40'
            )}>
              <div className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                active ? 'bg-primary text-white' : done ? 'bg-success text-white' : 'bg-muted text-muted-foreground/40'
              )}>
                {done ? '✓' : phase.num}
              </div>
              <span className="hidden sm:block">{phase.label}</span>
            </div>
            {i < PHASES.length - 1 && (
              <div className={cn('w-8 h-px mx-1', done ? 'bg-success/40' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Mermaid diagram renderer ─────────────────────────────────────────────────

function MermaidDiagram({ chart, id }: { chart: string; id: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const uid = `mermaid-${id}-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(uid, chart);
        if (!cancelled) { setSvg(rendered); setError(''); }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Render failed');
      }
    })();
    return () => { cancelled = true; };
  }, [chart, id]);

  if (error) return (
    <pre className="text-xs font-mono text-muted-foreground/60 p-4 whitespace-pre-wrap">{chart}</pre>
  );

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center p-4 [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// ─── Right panel — live plan artifact ────────────────────────────────────────

function LivePlanPanel({
  artifact,
  streaming,
  streamingText,
}: {
  artifact: ArtifactState | null;
  streaming: boolean;
  streamingText: string;
}) {
  const [tab, setTab] = useState<'preview' | 'source'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (artifact) navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!artifact && !streaming) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
        <div className="p-4 rounded-2xl bg-primary/6 border border-primary/10">
          <GitBranch className="h-8 w-8 text-primary/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/60">Plan preview</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Architecture diagrams and timelines will appear here as the AI works</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
        <GitBranch className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {artifact?.title ?? 'Generating plan...'}
        </span>
        {artifact && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/8 text-primary/70 font-mono">
            {artifact.type}
          </span>
        )}
        {streaming && (
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-thinking-dot"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        )}
      </div>

      {artifact && (
        <div className="flex items-center border-b border-border px-4 shrink-0">
          {['preview', 'source'].map(t => (
            <button key={t} onClick={() => setTab(t as any)}
              className={cn('text-xs font-medium px-3 py-2 border-b-2 transition-colors capitalize',
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}>
              {t}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {streaming && !artifact ? (
          <div className="p-4">
            <pre className="text-xs font-mono text-foreground/50 whitespace-pre-wrap leading-relaxed">
              {streamingText}
            </pre>
          </div>
        ) : artifact && tab === 'preview' ? (
          (artifact.type === 'mermaid' || artifact.type === 'timeline') ? (
            <MermaidDiagram chart={artifact.content} id={artifact.title.replace(/\s/g, '-')} />
          ) : (
            <pre className="text-xs font-mono text-foreground/70 p-4 whitespace-pre-wrap">{artifact.content}</pre>
          )
        ) : artifact ? (
          <pre className="text-xs font-mono text-foreground/60 p-4 whitespace-pre-wrap bg-muted/20">{artifact.content}</pre>
        ) : null}
      </div>
    </div>
  );
}

// ─── Module card (Phase 3) ────────────────────────────────────────────────────

function ModuleCard({
  mod,
  onUpdate,
}: {
  mod: ExtractedModule;
  onUpdate: (updated: ExtractedModule) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [localName, setLocalName] = useState(mod.name);
  const [localDays, setLocalDays] = useState(String(mod.estimated_days));
  const [localOwner, setLocalOwner] = useState(mod.owner);

  const save = () => {
    onUpdate({ ...mod, name: localName, estimated_days: Number(localDays) || 1, owner: localOwner });
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-4 group"
    >
      {editing ? (
        <div className="space-y-2">
          <input
            autoFocus
            value={localName}
            onChange={e => setLocalName(e.target.value)}
            className="w-full text-sm font-semibold bg-muted/30 border border-primary/20 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex gap-2">
            <input
              value={localOwner}
              onChange={e => setLocalOwner(e.target.value)}
              placeholder="Owner"
              className="flex-1 text-xs bg-muted/30 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            <input
              value={localDays}
              onChange={e => setLocalDays(e.target.value)}
              placeholder="Days"
              type="number"
              className="w-20 text-xs bg-muted/30 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors pt-0.5 cursor-grab shrink-0">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-sm">{mod.name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</p>
            <div className="flex items-center gap-3 mt-2">
              {mod.owner && (
                <span className="text-xs text-muted-foreground/60">{mod.owner}</span>
              )}
              <span className="text-xs font-mono text-primary/70 bg-primary/6 px-1.5 py-0.5 rounded">
                {mod.estimated_days}d
              </span>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main CoCreate component ──────────────────────────────────────────────────

export default function CoCreate() {
  const { id } = useParams();

  // Phase state
  const [phase, setPhase] = useState<Phase>('brief');
  const [brief, setBrief] = useState('');
  const [extractionStep, setExtractionStep] = useState(0);
  const [modules, setModules] = useState<ExtractedModule[]>([]);
  const [artifact, setArtifact] = useState<ArtifactState | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Follow-up chat (bottom bar, all phases)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpMessage[]>([]);
  const [followInput, setFollowInput] = useState('');
  const [followStreaming, setFollowStreaming] = useState(false);
  const followEndRef = useRef<HTMLDivElement>(null);

  // Starter card refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll follow-up chat
  useEffect(() => {
    followEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [followUps]);

  // ── Phase 2: extraction animation ──
  useEffect(() => {
    if (phase !== 'extracting') return;
    if (extractionStep >= EXTRACTION_STEPS.length) return;
    const t = setTimeout(() => setExtractionStep(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [phase, extractionStep]);

  // ── Analyze brief with Claude ──
  const analyzeBrief = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setPhase('extracting');
    setExtractionStep(0);
    setStreamingText('');
    setArtifact(null);
    setIsStreaming(true);

    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Please analyze this project brief and generate a full delivery plan.\n\nInclude:\n1. A list of delivery modules as an <artifact type="modules"> block\n2. An architecture diagram as an <artifact type="mermaid"> block\n3. A timeline as an <artifact type="timeline"> block\n\nBrief:\n${text}`,
      },
    ];
    setChatHistory(messages);

    let fullText = '';
    try {
      await streamChat(
        messages,
        (chunk) => {
          fullText += chunk;
          setStreamingText(fullText);

          // Parse artifacts as they arrive
          const { artifacts } = parseArtifacts(fullText);
          if (artifacts.length > 0) {
            // Prefer mermaid first, then timeline
            const mermaidArt = artifacts.find(a => a.type === 'mermaid') || artifacts.find(a => a.type === 'timeline');
            if (mermaidArt) setArtifact(mermaidArt);
          }
        },
        (done) => {
          setIsStreaming(false);
          const { clean, artifacts } = parseArtifacts(done);
          setChatHistory(prev => [...prev, { role: 'assistant', content: clean }]);

          // Extract modules from modules artifact
          const modulesArt = artifacts.find(a => a.type === 'modules');
          const mermaidArt = artifacts.find(a => a.type === 'mermaid') || artifacts.find(a => a.type === 'timeline');

          if (mermaidArt) setArtifact(mermaidArt);

          if (modulesArt) {
            try {
              const parsed: any[] = JSON.parse(modulesArt.content);
              setModules(parsed.map((m, i) => ({
                id: `mod-${i}`,
                name: m.name,
                description: m.description || '',
                owner: m.owner || '',
                estimated_days: m.estimated_days || 5,
                status: 'not_started',
              })));
            } catch {
              // Fall back to mock modules if JSON parse fails
              setModules([
                { id: 'mod-0', name: 'Project Setup', description: 'Repository, environments, CI/CD pipeline', owner: '', estimated_days: 3, status: 'not_started' },
                { id: 'mod-1', name: 'Core Features', description: 'Primary product functionality', owner: '', estimated_days: 10, status: 'not_started' },
                { id: 'mod-2', name: 'QA & Testing', description: 'Integration tests, UAT', owner: '', estimated_days: 5, status: 'not_started' },
                { id: 'mod-3', name: 'Deployment', description: 'Production release & monitoring', owner: '', estimated_days: 2, status: 'not_started' },
              ]);
            }
          } else {
            // If no modules artifact, still move to modules phase with empty list
            setModules([]);
          }

          setPhase('modules');
        },
        { project_id: id }
      );
    } catch (err) {
      setIsStreaming(false);
      setPhase('brief');
    }
  }, [id]);

  // ── Follow-up chat (bottom bar) ──
  const handleFollowUp = useCallback(async () => {
    if (!followInput.trim() || followStreaming) return;
    const text = followInput.trim();
    setFollowInput('');
    setFollowStreaming(true);

    const userMsg: FollowUpMessage = { role: 'user', content: text };
    setFollowUps(prev => [...prev, userMsg]);

    const messages: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: text },
    ];
    setChatHistory(messages);

    const assistantMsg: FollowUpMessage = { role: 'assistant', content: '', streaming: true };
    setFollowUps(prev => [...prev, assistantMsg]);

    let fullText = '';
    try {
      await streamChat(
        messages,
        (chunk) => {
          fullText += chunk;
          setFollowUps(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: fullText, streaming: true };
            return updated;
          });

          // Check for new artifacts in follow-up responses
          const { artifacts } = parseArtifacts(fullText);
          const newArt = artifacts.find(a => a.type === 'mermaid') || artifacts.find(a => a.type === 'timeline');
          if (newArt) setArtifact(newArt);
        },
        (done) => {
          const { clean, artifacts } = parseArtifacts(done);
          setChatHistory(prev => [...prev, { role: 'assistant', content: clean }]);
          setFollowUps(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: clean, streaming: false };
            return updated;
          });
          const newArt = artifacts.find(a => a.type === 'mermaid') || artifacts.find(a => a.type === 'timeline');
          if (newArt) setArtifact(newArt);
          setFollowStreaming(false);
        },
        { project_id: id }
      );
    } catch {
      setFollowStreaming(false);
    }
  }, [followInput, followStreaming, chatHistory, id]);

  const reset = () => {
    setPhase('brief');
    setBrief('');
    setModules([]);
    setArtifact(null);
    setStreamingText('');
    setChatHistory([]);
    setFollowUps([]);
    setExtractionStep(0);
  };

  // ── Render ──

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <PhaseBar current={phase} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: phase content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto">

            {/* ── Phase 1: Brief ── */}
            <AnimatePresence mode="wait">
              {phase === 'brief' && (
                <motion.div
                  key="brief"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full flex flex-col px-8 py-10 max-w-2xl mx-auto w-full"
                >
                  <div className="mb-8">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-3 mb-4"
                    >
                      <div className="p-2 rounded-xl bg-primary/8 border border-primary/10">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-heading text-xl font-bold text-foreground">Tell me about the project</h2>
                        <p className="text-sm text-muted-foreground">Paste a brief, meeting notes, or describe what you're building</p>
                      </div>
                    </motion.div>

                    {/* Starter cards */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="grid grid-cols-3 gap-3 mb-6"
                    >
                      {[
                        { icon: ClipboardList, label: 'Paste meeting notes', placeholder: 'We discussed building a service portal for Daikin...\n\nRequirements:\n- Product catalog with search\n- Service request system\n- Reporting dashboard\n\nTimeline: 3 months\nTeam: 3 developers' },
                        { icon: Wand2, label: 'Describe from scratch', placeholder: "We're building a B2B SaaS platform for logistics companies. Core features include real-time shipment tracking, automated invoicing, and a driver management portal. Target launch in 4 months with a team of 4." },
                        { icon: FolderOpen, label: 'Existing project', placeholder: 'We have an existing e-commerce platform that needs:\n- Checkout flow redesign\n- Payment gateway integration (Stripe)\n- Mobile app (React Native)\n- Admin dashboard improvements\n\nDeadline: Q2 2026' },
                      ].map(({ icon: Icon, label, placeholder }) => (
                        <button
                          key={label}
                          onClick={() => {
                            setBrief(placeholder);
                            textareaRef.current?.focus();
                          }}
                          className="card-interactive p-4 text-left group flex flex-col gap-2 hover:ring-1 hover:ring-primary/20"
                        >
                          <div className="p-2 rounded-lg bg-primary/6 w-fit group-hover:bg-primary/10 transition-colors">
                            <Icon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-xs font-medium text-foreground/80">{label}</span>
                        </button>
                      ))}
                    </motion.div>

                    {/* Big textarea */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <textarea
                        ref={textareaRef}
                        value={brief}
                        onChange={e => setBrief(e.target.value)}
                        placeholder="Paste client brief, meeting notes, requirements, or just describe the project in your own words..."
                        className="w-full h-48 resize-none rounded-xl border border-border bg-white px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all leading-relaxed"
                      />
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-muted-foreground/40">
                          {brief.length > 0 ? `${brief.length} characters` : 'The more detail you provide, the better the plan'}
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => analyzeBrief(brief)}
                          disabled={!brief.trim()}
                          className={cn(
                            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                            brief.trim()
                              ? 'bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20'
                              : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                          )}
                        >
                          <Wand2 className="h-4 w-4" />
                          Analyze with AI
                          <ArrowRight className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* ── Phase 2: Extracting ── */}
              {phase === 'extracting' && (
                <motion.div
                  key="extracting"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full flex flex-col items-center justify-center px-8 py-10 max-w-lg mx-auto w-full"
                >
                  <div className="mb-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="p-3 rounded-2xl bg-primary/8 border border-primary/10 w-fit mx-auto mb-4"
                    >
                      <Brain className="h-6 w-6 text-primary" />
                    </motion.div>
                    <h2 className="font-heading text-lg font-bold text-foreground mb-1">Analyzing your brief</h2>
                    <p className="text-sm text-muted-foreground">Building your delivery plan with AI...</p>
                  </div>

                  <div className="w-full space-y-2">
                    {EXTRACTION_STEPS.map((step, i) => {
                      const done = i < extractionStep;
                      const active = i === extractionStep;
                      return (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: done || active ? 1 : 0.3, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg"
                        >
                          <div className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all',
                            done ? 'bg-success' : active ? 'bg-primary animate-pulse-soft' : 'bg-muted'
                          )}>
                            {done
                              ? <Check className="h-3 w-3 text-white" />
                              : active
                              ? <div className="w-2 h-2 rounded-full bg-white" />
                              : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                            }
                          </div>
                          <span className={cn(
                            'text-sm transition-colors',
                            done ? 'text-foreground/60 line-through decoration-success/40' : active ? 'text-foreground font-medium' : 'text-muted-foreground/40'
                          )}>
                            {step}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── Phase 3: Modules ── */}
              {phase === 'modules' && (
                <motion.div
                  key="modules"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="px-6 py-6 max-w-2xl mx-auto w-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-heading text-lg font-bold text-foreground">Delivery Modules</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Review, edit, and reorder — then finalize</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModules(prev => [...prev, {
                          id: `mod-${Date.now()}`,
                          name: 'New Module',
                          description: 'Describe this module',
                          owner: '',
                          estimated_days: 5,
                          status: 'not_started',
                        }])}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 text-primary text-xs font-medium hover:bg-primary/6 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add module
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {modules.map((mod, i) => (
                      <motion.div
                        key={mod.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <ModuleCard
                          mod={mod}
                          onUpdate={updated => setModules(prev => prev.map(m => m.id === updated.id ? updated : m))}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <div className="text-xs text-muted-foreground/50 font-mono">
                      {modules.length} modules · ~{modules.reduce((s, m) => s + m.estimated_days, 0)} days total
                    </div>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setPhase('finalize')}
                    className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Looks good, finalize plan
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* ── Phase 4: Finalize ── */}
              {phase === 'finalize' && (
                <motion.div
                  key="finalize"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="px-6 py-6 max-w-2xl mx-auto w-full"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-success/8 border border-success/15">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg font-bold text-foreground">Plan finalized</h2>
                      <p className="text-xs text-muted-foreground">{modules.length} modules · ready to start delivery</p>
                    </div>
                  </div>

                  {/* Module summary */}
                  <div className="space-y-2 mb-6">
                    {modules.map((mod, i) => (
                      <div key={mod.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/30 border border-border">
                        <span className="text-xs font-mono text-primary/50 w-6 shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm font-medium text-foreground flex-1">{mod.name}</span>
                        {mod.owner && <span className="text-xs text-muted-foreground/60">{mod.owner}</span>}
                        <span className="text-xs font-mono bg-primary/6 text-primary/70 px-2 py-0.5 rounded shrink-0">
                          {mod.estimated_days}d
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={reset}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Start over
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm shadow-primary/20">
                      <Zap className="h-4 w-4" />
                      Start delivery
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Follow-up chat bar (persistent bottom) ── */}
          {(phase === 'modules' || phase === 'finalize' || followUps.length > 0) && (
            <div className="border-t border-border bg-white shrink-0">
              {/* Previous follow-up messages */}
              {followUps.length > 0 && (
                <div className="max-h-40 overflow-y-auto px-4 pt-3 space-y-2">
                  {followUps.map((msg, i) => (
                    <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      {msg.role === 'assistant' && (
                        <div className="p-1 rounded-md bg-primary/8 border border-primary/10 shrink-0 h-fit mt-0.5">
                          <Brain className="h-3 w-3 text-primary" />
                        </div>
                      )}
                      <div className={cn(
                        'text-xs px-3 py-2 rounded-xl max-w-[75%] leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'text-foreground/80'
                      )}>
                        {msg.content}
                        {msg.streaming && (
                          <span className="inline-flex gap-0.5 ml-1">
                            {[0,1,2].map(i => (
                              <span key={i} className="w-1 h-1 rounded-full bg-primary/40 animate-thinking-dot"
                                style={{ animationDelay: `${i*0.2}s` }} />
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={followEndRef} />
                </div>
              )}

              {/* Input row */}
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="flex items-center gap-2 flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                  <Brain className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <input
                    value={followInput}
                    onChange={e => setFollowInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFollowUp(); } }}
                    placeholder="Ask AI anything about this plan..."
                    className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
                    disabled={followStreaming}
                  />
                </div>
                <button
                  onClick={handleFollowUp}
                  disabled={!followInput.trim() || followStreaming}
                  className={cn(
                    'p-2.5 rounded-xl transition-all shrink-0',
                    followInput.trim() && !followStreaming
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground/30'
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: live plan panel */}
        <div className="w-[420px] shrink-0 border-l border-border bg-white hidden lg:flex flex-col">
          <LivePlanPanel
            artifact={artifact}
            streaming={isStreaming}
            streamingText={streamingText}
          />
        </div>
      </div>
    </div>
  );
}
