import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '@/api/claude';
import {
  streamInterviewMessage,
  parseModuleProposals,
  FALLBACK_MODULES,
  INTERVIEW_QUESTIONS,
  type InterviewPhase,
  type ProposedModule,
} from '@/api/cocreate';

export interface InterviewMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  streaming?: boolean;
}

export interface InterviewState {
  phase: InterviewPhase;
  messages: InterviewMessage[];
  questionIndex: number;
  modules: ProposedModule[];
  isStreaming: boolean;
  userAnswers: string[];
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function useInterviewSession(projectId: string) {
  const [state, setState] = useState<InterviewState>({
    phase: 'detecting',
    messages: [],
    questionIndex: 0,
    modules: [],
    isStreaming: false,
    userAnswers: [],
  });

  const streamingMsgId = useRef<string | null>(null);

  const addAiMessage = useCallback((content: string, streaming = false): string => {
    const id = makeId();
    setState((s) => ({
      ...s,
      messages: [...s.messages, { id, role: 'ai', content, streaming }],
      isStreaming: streaming,
    }));
    return id;
  }, []);

  const updateAiMessage = useCallback((id: string, content: string, streaming: boolean) => {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) => (m.id === id ? { ...m, content, streaming } : m)),
      isStreaming: streaming,
    }));
  }, []);

  const addUserMessage = useCallback((content: string) => {
    setState((s) => ({
      ...s,
      messages: [...s.messages, { id: makeId(), role: 'user', content }],
    }));
  }, []);

  /** Start the interview from the detection phase. */
  const startInterview = useCallback(async () => {
    setState((s) => ({ ...s, phase: 'questioning' }));

    const openingLine =
      'I found 3 recent meetings with context on this project. Let me ask a few focused questions to shape the delivery plan.\n\n' +
      INTERVIEW_QUESTIONS[0];

    const msgId = addAiMessage('', true);
    streamingMsgId.current = msgId;

    const messages: ChatMessage[] = [
      {
        role: 'user',
        content:
          'I want to start the project scoping interview. Please begin by asking me the first discovery question.',
      },
    ];

    await streamInterviewMessage(messages, 'questioning', 1, (chunk) => {
      setState((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === streamingMsgId.current ? { ...m, content: m.content + chunk } : m,
        ),
      }));
    }, (fullText) => {
      // If AI didn't give a good response, use the scripted question
      const finalText = fullText.length > 20 ? fullText : openingLine;
      updateAiMessage(msgId, finalText, false);
    });
  }, [addAiMessage, updateAiMessage]);

  /** User submits an answer to the current question. */
  const submitAnswer = useCallback(
    async (answer: string) => {
      if (state.isStreaming) return;

      addUserMessage(answer);
      const newAnswers = [...state.userAnswers, answer];
      const nextIdx = state.questionIndex + 1;

      setState((s) => ({ ...s, userAnswers: newAnswers }));

      if (nextIdx >= INTERVIEW_QUESTIONS.length) {
        // All questions answered — move to proposing
        setState((s) => ({ ...s, phase: 'proposing', questionIndex: nextIdx }));
        await requestModuleProposals(newAnswers);
      } else {
        setState((s) => ({ ...s, questionIndex: nextIdx }));
        await askNextQuestion(answer, nextIdx, newAnswers);
      }
    },
    [state], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const askNextQuestion = useCallback(
    async (lastAnswer: string, nextIdx: number, answers: string[]) => {
      const msgId = addAiMessage('', true);
      streamingMsgId.current = msgId;

      const messages: ChatMessage[] = buildMessageHistory(answers.slice(0, nextIdx), nextIdx - 1);

      await streamInterviewMessage(
        messages,
        'questioning',
        nextIdx + 1,
        (chunk) => {
          setState((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === streamingMsgId.current ? { ...m, content: m.content + chunk } : m,
            ),
          }));
        },
        (fullText) => {
          const fallback = `Got it. ${INTERVIEW_QUESTIONS[nextIdx]}`;
          updateAiMessage(msgId, fullText.length > 20 ? fullText : fallback, false);
        },
      );
    },
    [addAiMessage, updateAiMessage],
  );

  const requestModuleProposals = useCallback(
    async (answers: string[]) => {
      const msgId = addAiMessage('', true);
      streamingMsgId.current = msgId;

      const messages: ChatMessage[] = [
        ...buildMessageHistory(answers, answers.length - 1),
        {
          role: 'user',
          content:
            'Based on everything discussed, please propose the delivery modules for this project. ' +
            'Output a <modules> JSON array with: name, description, estimated_days, owner.',
        },
      ];

      await streamInterviewMessage(
        messages,
        'proposing',
        0,
        (chunk) => {
          setState((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === streamingMsgId.current ? { ...m, content: m.content + chunk } : m,
            ),
          }));
        },
        (fullText) => {
          const parsed = parseModuleProposals(fullText);
          const modules = parsed ?? FALLBACK_MODULES;
          const displayText = parsed
            ? "Here's my proposed delivery plan based on our conversation. Review each module below — approve, modify, or reject:"
            : "Here's my proposed delivery plan based on our conversation. Review each module — approve, modify, or reject:";

          updateAiMessage(msgId, displayText, false);
          setState((s) => ({ ...s, phase: 'reviewing', modules }));
        },
      );
    },
    [addAiMessage, updateAiMessage],
  );

  /** Update a module decision (approve/reject/modify). */
  const decideModule = useCallback((moduleId: string, decision: ProposedModule['decision']) => {
    setState((s) => ({
      ...s,
      modules: s.modules.map((m) => (m.id === moduleId ? { ...m, decision } : m)),
    }));
  }, []);

  /** Inline-edit a module's name or days estimate. */
  const editModule = useCallback(
    (moduleId: string, fields: { name?: string; days?: number }) => {
      setState((s) => ({
        ...s,
        modules: s.modules.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                editedName: fields.name ?? m.editedName,
                editedDays: fields.days ?? m.editedDays,
              }
            : m,
        ),
      }));
    },
    [],
  );

  /** All modules reviewed — mark complete. */
  const finishReview = useCallback(() => {
    const approved = state.modules.filter((m) => m.decision === 'approved');
    const finalMsg = `Plan finalized. ${approved.length} modules approved. Ready to kick off the project.`;
    addAiMessage(finalMsg);
    setState((s) => ({ ...s, phase: 'complete' }));
  }, [state.modules, addAiMessage]);

  const approvedModules = state.modules.filter((m) => m.decision === 'approved');
  const allReviewed = state.modules.length > 0 && state.modules.every((m) => m.decision !== 'pending');

  return {
    ...state,
    approvedModules,
    allReviewed,
    startInterview,
    submitAnswer,
    decideModule,
    editModule,
    finishReview,
  };
}

function buildMessageHistory(answers: string[], questionCount: number): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: 'I want to start the project scoping interview. Please begin.',
    },
  ];

  for (let i = 0; i < Math.min(answers.length, questionCount + 1); i++) {
    messages.push({ role: 'assistant', content: INTERVIEW_QUESTIONS[i] ?? '' });
    if (answers[i]) {
      messages.push({ role: 'user', content: answers[i] });
    }
  }

  return messages;
}
