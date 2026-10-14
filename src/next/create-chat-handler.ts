import { runMottyTurn } from "../core/agent-loop.js";
import { mottyConfig, type MottyConfigInput, configureMotty } from "../core/config.js";
import { getPublicMottyRuntime } from "../core/runtime.js";
import {
  appendTurn,
  readMottySessionFromJar,
  writeMottySessionToJar,
  type CookieJar,
} from "../core/session.js";
import type { MottyLearningContext, MottyLocale } from "../core/types.js";
import { publicEcosystemPrompt } from "../presets/prompts.js";
import {
  DEFAULT_ENABLED_TOOLS,
  type MottyToolName,
} from "../tools/index.js";

export type MottyAuthResult =
  | { mode: "anonymous" }
  | { mode: "authenticated"; userId: string };

export type CreateMottyChatHandlerOptions = {
  /** Called once; merges into package config (cookie name, MCP client, offers…). */
  config?: MottyConfigInput;
  /** Resolve auth per request. Default: anonymous. */
  resolveAuth?: (request: Request) => Promise<MottyAuthResult>;
  /** Optional learning/progress loader (Hub). Must scope to auth userId. */
  loadLearningContext?: (
    userId: string,
  ) => Promise<MottyLearningContext | null>;
  systemPrompt?: (
    locale: MottyLocale,
    extras: { pagePath: string | null; userId?: string },
  ) => string;
  enabledTools?: readonly MottyToolName[];
  /** Provide Next cookies() adapter. Required for session persistence. */
  getCookieJar: () => Promise<CookieJar> | CookieJar;
  rateLimit?: {
    windowMs?: number;
    maxHits?: number;
  };
  onAuthError?: (error: unknown) => Response | null;
};

const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Factory for `POST /api/motty/chat` in Next.js App Router.
 *
 * ```ts
 * // app/api/motty/chat/route.ts
 * import { cookies } from 'next/headers'
 * import { createMottyChatHandler } from '@motusdao/motty/next'
 *
 * const handler = createMottyChatHandler({
 *   config: { cookieName: 'motty_session', mcpClientName: 'motty-myapp' },
 *   getCookieJar: async () => cookies(),
 * })
 * export const POST = handler
 * export const runtime = 'nodejs'
 * ```
 */
export function createMottyChatHandler(options: CreateMottyChatHandlerOptions) {
  if (options.config) configureMotty(options.config);

  const windowMs = options.rateLimit?.windowMs ?? 10 * 60 * 1000;
  const maxHits = options.rateLimit?.maxHits ?? 24;
  const enabledTools = options.enabledTools ?? DEFAULT_ENABLED_TOOLS;
  const systemPrompt = options.systemPrompt ?? ((locale) => publicEcosystemPrompt(locale));
  const resolveAuth =
    options.resolveAuth ?? (async (): Promise<MottyAuthResult> => ({ mode: "anonymous" }));

  return async function POST(request: Request): Promise<Response> {
    if (getPublicMottyRuntime() !== "in-process-loop") {
      return json({ error: "unavailable" }, 503);
    }

    let auth: MottyAuthResult;
    try {
      auth = await resolveAuth(request);
    } catch (error) {
      const handled = options.onAuthError?.(error);
      if (handled) return handled;
      return json({ error: "unauthorized" }, 401);
    }

    let body: { message?: unknown; locale?: unknown; pagePath?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const message =
      typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return json({ error: "empty_message" }, 400);

    const { maxMessageChars } = mottyConfig();
    if (message.length > maxMessageChars) {
      return json({ error: "message_too_long" }, 400);
    }

    const locale: MottyLocale = body.locale === "es" ? "es" : body.locale === "en" ? "en" : "es";
    const pagePath =
      typeof body.pagePath === "string"
        ? sanitizePath(body.pagePath)
        : null;

    const userId = auth.mode === "authenticated" ? auth.userId : undefined;
    const jar = await options.getCookieJar();
    const session = readMottySessionFromJar(jar, { locale, userId });
    session.locale = locale;

    const rateKey =
      userId ??
      `${session.id}:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"}`;
    if (rateLimited(rateKey, windowMs, maxHits)) {
      return json({ error: "rate_limited" }, 429);
    }

    let learningContext: MottyLearningContext | null = null;
    if (userId && options.loadLearningContext) {
      try {
        learningContext = await options.loadLearningContext(userId);
        if (learningContext && learningContext.userId !== userId) {
          learningContext = null;
        }
      } catch {
        learningContext = null;
      }
    }

    try {
      const turn = await runMottyTurn({
        session,
        userMessage: message,
        systemPrompt: systemPrompt(locale, { pagePath, userId }),
        enabledTools,
        learningContext,
      });
      const next = appendTurn(turn.session, message, turn.reply);
      writeMottySessionToJar(jar, next);
      return json({ reply: turn.reply, sessionId: next.id });
    } catch {
      const fallback =
        locale === "en"
          ? "I could not answer just now. Try again in a moment."
          : "No pude responder ahora. Intenta de nuevo en un momento.";
      const next = appendTurn(session, message, fallback);
      writeMottySessionToJar(jar, next);
      return json({ reply: fallback, sessionId: next.id, degraded: true });
    }
  };
}

function sanitizePath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.includes("://") || trimmed.includes("..")) return null;
  return trimmed.slice(0, 200);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function rateLimited(key: string, windowMs: number, maxHits: number): boolean {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > maxHits;
}
