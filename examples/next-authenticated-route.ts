/**
 * Example: authenticated Motty (Hub-style) with learning context adapter.
 *
 * Host app provides:
 * - resolveAuth → server-verified userId (never from client body)
 * - loadLearningContext → Prisma / DB query scoped to that userId
 */
import { cookies } from "next/headers";
import {
  createMottyChatHandler,
  type MottyAuthResult,
} from "../src/next/index.js";
import { hubCompanionPrompt } from "../src/presets/prompts.js";
import type { MottyLearningContext } from "../src/core/types.js";

async function requireUser(_request: Request): Promise<MottyAuthResult> {
  // Replace with your Hub/session guard:
  // const auth = await requireSession(request)
  // return { mode: 'authenticated', userId: assertAuthenticatedUser(auth) }
  throw new Error("wire_your_auth_here");
}

async function loadLearningContext(
  userId: string,
): Promise<MottyLearningContext | null> {
  // Replace with your Prisma query (see motusdao-hub lib/motty/learning-context.ts)
  return {
    userId,
    currentRouteStage: null,
    summary: [
      "## Authenticated learner context (server-derived)",
      `userId: ${userId}`,
      "currentRouteStage: none",
      "Instructions: orient the professional; do not invent progress.",
    ].join("\n"),
  };
}

const handler = createMottyChatHandler({
  config: {
    cookieName: "motty_hub_apd_session",
    mcpClientName: "motty-hub-example",
  },
  resolveAuth: requireUser,
  loadLearningContext,
  systemPrompt: (locale, { pagePath }) =>
    hubCompanionPrompt(locale, { pagePath }),
  getCookieJar: async () => cookies(),
  rateLimit: { maxHits: 40 },
});

export const runtime = "nodejs";
export const POST = handler;
