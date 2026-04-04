import { streamClaude, type ClaudeMessage } from './claudeDirect';
import { streamChat, type ChatMessage } from './claude';

export type InterviewPhase =
  | 'detecting'
  | 'questioning'
  | 'proposing'
  | 'reviewing'
  | 'complete';

export interface ProposedModule {
  id: string;
  name: string;
  description: string;
  estimated_days: number;
  owner: string;
  decision: 'pending' | 'approved' | 'rejected';
  editedName?: string;
  editedDays?: number;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const INTERVIEW_SYSTEM_PROMPT = `You are an expert software delivery planning consultant. You are conducting a structured AI-led discovery interview to help a consultant plan a software delivery project with precision.

## Your role
- Lead the conversation — you ask the questions, the consultant answers
- Build a mental model of the project from the answers you receive
- When you have enough context, propose a concrete delivery module breakdown

## Interview flow
1. **Questioning phase** (3–4 questions): Ask ONE question at a time. Briefly acknowledge each answer (1 sentence max) before asking the next question. Focus on: project type & users → critical outcomes → technical constraints → team composition & risks.
2. **Proposing phase**: After the final question, transition naturally into proposing modules. Output a JSON array wrapped in <modules>...</modules> tags immediately before your closing sentence.
3. **Reviewing phase**: Help the consultant refine individual modules. Respond to approvals/rejections/edits with brief acknowledgment.

## Module JSON format
Each module must include:
- name: Clear, noun-phrase title (e.g. "Auth & SSO", "Product Catalog")
- description: One sentence describing scope
- estimated_days: Realistic estimate based on team size and complexity (5–20 days per module)
- owner: Role-based owner (e.g. "Tech Lead", "UX", "Backend Dev", or "TBD")

## Style rules
- Be concise: 40–70 words per response max (except when outputting JSON)
- Sound like a seasoned consultant, not a chatbot
- Never repeat information the consultant already provided
- Tailor module estimates to what you learned about team size and complexity
- If the consultant mentions specific tech (Azure AD, ERP, etc.), reflect that in module names`;

// ─── Streaming ─────────────────────────────────────────────────────────────

/**
 * Streams the next AI message in the interview conversation.
 * Tries direct Claude API first, falls back to the backend /chat endpoint.
 */
export async function streamInterviewMessage(
  messages: ClaudeMessage[],
  phase: InterviewPhase,
  questionNumber: number,
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
): Promise<void> {
  // Phase-specific instruction appended to system prompt
  const phaseHint =
    phase === 'questioning'
      ? `\n\n[You are in the QUESTIONING phase. This is question ${questionNumber} of 4. Ask the next discovery question.]`
      : phase === 'proposing'
      ? '\n\n[You are now in the PROPOSING phase. You have enough context. Propose the module breakdown now. Output <modules>[...]</modules> JSON then a brief closing sentence.]'
      : '\n\n[You are in the REVIEWING phase. Help refine individual modules as the consultant approves, rejects, or edits them.]';

  try {
    await streamClaude(
      INTERVIEW_SYSTEM_PROMPT + phaseHint,
      messages,
      onChunk,
      onDone,
    );
  } catch (err) {
    // Fallback to backend
    console.warn('Direct Claude API unavailable, falling back to backend:', err);
    const backendMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    await streamChat(backendMessages, onChunk, onDone, {
      mode: 'ai_interview',
      phase,
      question_number: questionNumber,
      instructions:
        'You are conducting a structured discovery interview for a software delivery project. ' +
        'Be concise — under 60 words per response. Ask ONE question at a time. ' +
        'Acknowledge the user\'s answer briefly before moving on. ' +
        'When proposing modules, output a JSON array wrapped in <modules>...</modules> tags. ' +
        'Each module: { name, description, estimated_days, owner }.',
    });
  }
}

// ─── Parsing ────────────────────────────────────────────────────────────────

/**
 * Parses a <modules>[...]</modules> block from the AI response.
 */
export function parseModuleProposals(text: string): ProposedModule[] | null {
  const match = text.match(/<modules>([\s\S]*?)<\/modules>/);
  if (!match) return null;
  try {
    const raw: { name: string; description: string; estimated_days: number; owner: string }[] =
      JSON.parse(match[1].trim());
    return raw.map((m, i) => ({
      id: `proposed-${i}`,
      name: m.name,
      description: m.description,
      estimated_days: m.estimated_days ?? 10,
      owner: m.owner ?? 'TBD',
      decision: 'pending',
    }));
  } catch {
    return null;
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** The 4 discovery questions the AI uses as a guide. */
export const INTERVIEW_QUESTIONS = [
  'What type of project is this — SaaS product, client portal, internal tool, or something else? And who are the end users?',
  'What are the 2–3 most critical outcomes the client needs by go-live?',
  'Are there any hard technical constraints — existing systems to integrate, auth requirements, performance targets?',
  'What is the team composition and are there any known delivery risks or blockers at this stage?',
];

/** Fallback module proposals if AI doesn't produce parseable JSON. */
export const FALLBACK_MODULES: ProposedModule[] = [
  { id: 'fb-1', name: 'Authentication & SSO', description: 'User auth via Azure AD, role-based access', estimated_days: 8, owner: 'Tech Lead', decision: 'pending' },
  { id: 'fb-2', name: 'Product Catalog', description: 'Product listing, search, filtering, detail views', estimated_days: 14, owner: 'Backend Dev', decision: 'pending' },
  { id: 'fb-3', name: 'Warranty Lookup', description: 'Serial number lookup with warranty status and history', estimated_days: 10, owner: 'Backend Dev', decision: 'pending' },
  { id: 'fb-4', name: 'Service Scheduling', description: 'Dealer can request and manage service appointments', estimated_days: 12, owner: 'Tech Lead', decision: 'pending' },
  { id: 'fb-5', name: 'ERP Integration', description: 'REST API bridge to existing ERP system for live data sync', estimated_days: 16, owner: 'Backend Dev', decision: 'pending' },
  { id: 'fb-6', name: 'Dealer Dashboard', description: 'Overview of active products, warranty status, recent orders', estimated_days: 10, owner: 'UX', decision: 'pending' },
  { id: 'fb-7', name: 'Notifications', description: 'Email and in-app alerts for service updates and warranty expiry', estimated_days: 6, owner: 'TBD', decision: 'pending' },
];
