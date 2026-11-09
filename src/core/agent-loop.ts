import { hasMottyInference, mottyConfig } from "./config.js";
import {
  formatKnowledgeForVisitor,
  searchPublicKnowledge,
} from "./mcp.js";
import {
  createChatCompletion,
  type ProviderMessage,
} from "./provider.js";
import type {
  MottyAction,
  MottyLearningContext,
  MottyLocale,
  MottySession,
} from "./types.js";
import { isMottyAction } from "./payments.js";
import {
  DEFAULT_ENABLED_TOOLS,
  enabledToolSchemas,
  executeMottyTool,
  type MottyToolName,
} from "../tools/index.js";

export type RunMottyTurnInput = {
  session: MottySession;
  userMessage: string;
  systemPrompt: string;
  /** Extra system messages (e.g. learning context summary). */
  contextMessages?: string[];
  enabledTools?: readonly MottyToolName[];
  learningContext?: MottyLearningContext | null;
  fallbackCopy?: { es: string; en: string };
  groundedFallback?: (
    userMessage: string,
    locale: MottyLocale,
    learningContext: MottyLearningContext | null,
  ) => Promise<string>;
};

export async function runMottyTurn(
  input: RunMottyTurnInput,
): Promise<{ session: MottySession; reply: string; actions: MottyAction[] }> {
  const {
    session,
    userMessage,
    systemPrompt,
    contextMessages = [],
    enabledTools = DEFAULT_ENABLED_TOOLS,
    learningContext = null,
  } = input;
  const { maxToolRounds } = mottyConfig();
  const actions: MottyAction[] = [];

  // Never allow injecting another user's context into this turn.
  const safeLearning =
    learningContext &&
    (!session.userId || learningContext.userId === session.userId)
      ? learningContext
      : null;

  if (!hasMottyInference()) {
    const reply = input.groundedFallback
      ? await input.groundedFallback(userMessage, session.locale, safeLearning)
      : await defaultGroundedFallback(
          userMessage,
          session.locale,
          safeLearning,
          input.fallbackCopy,
        );
    return { session, reply, actions: [] };
  }

  const messages: ProviderMessage[] = [
    { role: "system", content: systemPrompt },
    ...contextMessages.map((content) => ({
      role: "system" as const,
      content,
    })),
    ...(safeLearning?.summary
      ? [{ role: "system" as const, content: safeLearning.summary }]
      : []),
    ...session.messages.map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    })),
    { role: "user", content: userMessage },
  ];

  const tools = enabledToolSchemas(enabledTools);
  let working = session;

  for (let round = 0; round < maxToolRounds; round += 1) {
    const completion = await createChatCompletion({ messages, tools });
    const { message } = completion;
    const calls = message.tool_calls ?? [];

    if (!calls.length) {
      const reply =
        (message.content ?? "").trim() ||
        fallbackCopy(session.locale, input.fallbackCopy);
      return { session: working, reply, actions };
    }

    messages.push({
      role: "assistant",
      content: message.content,
      tool_calls: calls,
    });

    for (const call of calls) {
      let parsed: unknown = {};
      try {
        parsed = call.function.arguments
          ? JSON.parse(call.function.arguments)
          : {};
      } catch {
        parsed = {};
      }

      const executed = await executeMottyTool(
        call.function.name,
        parsed,
        working,
        enabledTools,
      );
      working = executed.session;

      if (executed.result.ok && isMottyAction(executed.result.data)) {
        actions.push(executed.result.data);
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(executed.result),
      });
    }
  }

  const last = await createChatCompletion({
    messages: [
      ...messages,
      {
        role: "system",
        content:
          "Stop calling tools. Answer now from the tool results you already have.",
      },
    ],
  });

  const reply =
    (last.message.content ?? "").trim() ||
    fallbackCopy(session.locale, input.fallbackCopy);
  return { session: working, reply, actions };
}

async function defaultGroundedFallback(
  userMessage: string,
  locale: MottyLocale,
  learningContext: MottyLearningContext | null,
  copy?: { es: string; en: string },
): Promise<string> {
  try {
    const hits = await searchPublicKnowledge({ query: userMessage });
    const context = formatKnowledgeForVisitor(hits);
    const stage = learningContext?.currentRouteStage;

    if (!hits.length || !context) {
      return fallbackCopy(locale, copy);
    }

    if (locale === "en") {
      return `I am Motty, a MotusDAO guide — not a therapist.${stage ? ` Current stage: ${stage}.` : ""}\n\n${context}`;
    }
    return `Soy Motty, guía de MotusDAO — no soy terapeuta.${stage ? ` Etapa actual: ${stage}.` : ""}\n\n${context}`;
  } catch {
    return fallbackCopy(locale, copy);
  }
}

function fallbackCopy(
  locale: MottyLocale,
  copy?: { es: string; en: string },
): string {
  if (copy) return locale === "en" ? copy.en : copy.es;
  return locale === "en"
    ? "I can orient you with public MotusDAO knowledge, but I could not finish this reply. Try again in a moment."
    : "Puedo orientarte con el conocimiento público de MotusDAO, pero no pude completar la respuesta. Intenta de nuevo en un momento.";
}
