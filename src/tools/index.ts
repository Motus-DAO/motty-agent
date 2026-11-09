import { getHandoffAdapter } from "../core/handoff.js";
import {
  NamespaceNotAllowedError,
  formatKnowledgeForModel,
  searchPublicKnowledge,
} from "../core/mcp.js";
import { getOffer, recommendOffer } from "../core/offers.js";
import type { MottyAudience, MottySession, ToolResult } from "../core/types.js";
import {
  PAYMENT_TOOL_NAMES,
  PAYMENT_TOOL_SCHEMAS,
  executePaymentTool,
  type PaymentToolName,
} from "./payments.js";

export const ALL_MOTTY_TOOL_NAMES = [
  "searchKnowledge",
  "updateCurrentLead",
  "getRecommendedOffer",
  "createCheckout",
  "createAccount",
  "handoffToHuman",
  "getMyUpcomingSession",
  "quoteTherapyInWmxn",
  "getMyWalletBalance",
  "getMyPaymentStatus",
  "createTherapyEscrowForMySession",
  "getMyRipioRampLink",
  "prepareTransfer",
  "getMyTherapistAvailability",
  "bookTherapySession",
  "createProductPayment",
] as const;

export type MottyToolName = (typeof ALL_MOTTY_TOOL_NAMES)[number];

/** Slice 1–2 default: knowledge only. Enable funnel tools via `enabledTools`. */
export const DEFAULT_ENABLED_TOOLS: readonly MottyToolName[] = [
  "searchKnowledge",
];

type JsonSchema = Record<string, unknown>;

export type OpenAiTool = {
  type: "function";
  function: {
    name: MottyToolName;
    description: string;
    parameters: JsonSchema;
  };
};

const TOOL_SCHEMAS: Record<string, OpenAiTool> = {
  searchKnowledge: {
    type: "function",
    function: {
      name: "searchKnowledge",
      description:
        "Search public MotusDAO knowledge (brand and product only) via Motus Knowledge MCP. Use before answering factual questions about MotusDAO. Never invent MotusDAO facts.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Natural-language query." },
          namespace: {
            type: "string",
            enum: ["brand", "product"],
            description:
              "Optional public namespace. Internal namespaces are rejected server-side.",
          },
        },
        required: ["query"],
      },
    },
  },
  updateCurrentLead: {
    type: "function",
    function: {
      name: "updateCurrentLead",
      description:
        "Save basic visitor lead fields on this session (name, email, audience, intent).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          audience: {
            type: "string",
            enum: ["users", "professionals", "community", "unknown"],
          },
          intent: { type: "string" },
        },
      },
    },
  },
  getRecommendedOffer: {
    type: "function",
    function: {
      name: "getRecommendedOffer",
      description:
        "Recommend a MotusDAO surface from simple audience rules. Does not invent prices or guarantees.",
      parameters: { type: "object", properties: {} },
    },
  },
  createCheckout: {
    type: "function",
    function: {
      name: "createCheckout",
      description:
        "Return a deep-link URL for the recommended offer. Does not charge a card.",
      parameters: {
        type: "object",
        properties: { offerId: { type: "string" } },
      },
    },
  },
  createAccount: {
    type: "function",
    function: {
      name: "createAccount",
      description:
        "Return a registration URL for this visitor. Does not create an account here.",
      parameters: { type: "object", properties: {} },
    },
  },
  handoffToHuman: {
    type: "function",
    function: {
      name: "handoffToHuman",
      description:
        "Request a human follow-up using the configured handoff adapter.",
      parameters: {
        type: "object",
        properties: { reason: { type: "string" } },
      },
    },
  },
  ...Object.fromEntries(
    PAYMENT_TOOL_SCHEMAS.map((tool) => [tool.function.name, tool]),
  ),
};

export const PAYMENT_ENABLED_TOOLS: readonly MottyToolName[] = [
  ...PAYMENT_TOOL_NAMES,
];

export function enabledToolSchemas(
  enabled: readonly MottyToolName[] = DEFAULT_ENABLED_TOOLS,
): OpenAiTool[] {
  return enabled.map((name) => TOOL_SCHEMAS[name] as OpenAiTool);
}

export async function executeMottyTool(
  name: string,
  rawArgs: unknown,
  session: MottySession,
  enabled: readonly MottyToolName[] = DEFAULT_ENABLED_TOOLS,
): Promise<{ result: ToolResult; session: MottySession }> {
  if (!isMottyToolName(name)) {
    return { session, result: { ok: false, tool: name, error: "tool_unknown" } };
  }
  if (!enabled.includes(name)) {
    return {
      session,
      result: { ok: false, tool: name, error: "tool_not_enabled" },
    };
  }

  const args = isRecord(rawArgs) ? rawArgs : {};

  if ((PAYMENT_TOOL_NAMES as readonly string[]).includes(name)) {
    return executePaymentTool(name as PaymentToolName, args, session);
  }

  switch (name) {
    case "searchKnowledge":
      return { session, result: await runSearchKnowledge(args) };
    case "updateCurrentLead":
      return runUpdateLead(session, args);
    case "getRecommendedOffer":
      return runRecommendedOffer(session);
    case "createCheckout":
      return runCreateCheckout(session, args);
    case "createAccount":
      return runCreateAccount(session);
    case "handoffToHuman":
      return runHandoff(session, args);
    default:
      return { session, result: { ok: false, tool: name, error: "tool_unknown" } };
  }
}

async function runSearchKnowledge(
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const query = typeof args.query === "string" ? args.query : "";
  const namespace =
    typeof args.namespace === "string" ? args.namespace : undefined;

  try {
    const hits = await searchPublicKnowledge({ query, namespace });
    return {
      ok: true,
      tool: "searchKnowledge",
      data: {
        namespaces: hits.map((hit) => hit.namespace),
        context: formatKnowledgeForModel(hits),
      },
    };
  } catch (error) {
    if (error instanceof NamespaceNotAllowedError) {
      return {
        ok: false,
        tool: "searchKnowledge",
        error: `namespace_not_allowed:${error.namespace}`,
      };
    }
    return { ok: false, tool: "searchKnowledge", error: "knowledge_unavailable" };
  }
}

function runUpdateLead(
  session: MottySession,
  args: Record<string, unknown>,
): { result: ToolResult; session: MottySession } {
  const next: MottySession = {
    ...session,
    lead: {
      ...session.lead,
      ...(typeof args.name === "string" ? { name: args.name.slice(0, 80) } : {}),
      ...(typeof args.email === "string"
        ? { email: args.email.slice(0, 120) }
        : {}),
      ...(isAudience(args.audience) ? { audience: args.audience } : {}),
      ...(typeof args.intent === "string"
        ? { intent: args.intent.slice(0, 240) }
        : {}),
    },
  };
  return {
    session: next,
    result: { ok: true, tool: "updateCurrentLead", data: { lead: next.lead } },
  };
}

function runRecommendedOffer(session: MottySession): {
  result: ToolResult;
  session: MottySession;
} {
  const offer = recommendOffer(session.lead.audience ?? "unknown");
  const next = { ...session, offerId: offer.id };
  return {
    session: next,
    result: {
      ok: true,
      tool: "getRecommendedOffer",
      data: {
        offerId: offer.id,
        href: offer.href,
        audience: offer.audience,
        checkout: "deep_link",
      },
    },
  };
}

function runCreateCheckout(
  session: MottySession,
  args: Record<string, unknown>,
): { result: ToolResult; session: MottySession } {
  const requested =
    typeof args.offerId === "string" ? getOffer(args.offerId) : undefined;
  const offer =
    requested ?? recommendOffer(session.lead.audience ?? "unknown");
  return {
    session,
    result: {
      ok: true,
      tool: "createCheckout",
      data: { checkoutUrl: offer.href, offerId: offer.id, mode: "deep_link" },
    },
  };
}

function runCreateAccount(session: MottySession): {
  result: ToolResult;
  session: MottySession;
} {
  const offer = recommendOffer(session.lead.audience ?? "unknown");
  return {
    session,
    result: {
      ok: true,
      tool: "createAccount",
      data: { registerUrl: offer.href, mode: "deep_link" },
    },
  };
}

function runHandoff(
  session: MottySession,
  args: Record<string, unknown>,
): { result: ToolResult; session: MottySession } {
  const adapter = getHandoffAdapter();
  const reason =
    typeof args.reason === "string" ? args.reason.slice(0, 240) : undefined;
  const next: MottySession = {
    ...session,
    handoff: {
      at: new Date().toISOString(),
      reason,
      channelId: adapter.id,
    },
  };

  if (adapter.kind === "disabled" || !adapter.href) {
    return {
      session: next,
      result: {
        ok: true,
        tool: "handoffToHuman",
        data: { status: "logged", channel: "disabled" },
      },
    };
  }

  return {
    session: next,
    result: {
      ok: true,
      tool: "handoffToHuman",
      data: {
        status: "ready",
        channel: adapter.kind,
        href: adapter.href,
        label: adapter.label,
      },
    },
  };
}

function isMottyToolName(name: string): name is MottyToolName {
  return (ALL_MOTTY_TOOL_NAMES as readonly string[]).includes(name);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAudience(value: unknown): value is MottyAudience {
  return (
    value === "users" ||
    value === "professionals" ||
    value === "community" ||
    value === "unknown"
  );
}
