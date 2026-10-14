/**
 * Example: public Motty on a Next.js App Router landing.
 *
 * Copy into: app/api/motty/chat/route.ts
 * Also copy assets/motty/* → public/motty/
 * Mount <MottyWidget copy={...} /> in layout.
 */
import { cookies } from "next/headers";
import { createMottyChatHandler } from "../src/next/index.js";

const handler = createMottyChatHandler({
  config: {
    cookieName: "motty_session",
    mcpClientName: "motty-public-example",
  },
  getCookieJar: async () => cookies(),
  // enabledTools defaults to ["searchKnowledge"] only.
  // To enable funnel: ["searchKnowledge", "updateCurrentLead", "getRecommendedOffer", ...]
});

export const runtime = "nodejs";
export const POST = handler;
