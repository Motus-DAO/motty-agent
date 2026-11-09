import type { OpenAiTool } from "./index.js";
import { getMottyPaymentsAdapter, type MottyPaymentsAdapter } from "../core/payments.js";
import type { MottySession, ToolResult } from "../core/types.js";

export const PAYMENT_TOOL_NAMES = [
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

export type PaymentToolName = (typeof PAYMENT_TOOL_NAMES)[number];

export const PAYMENT_TOOL_SCHEMAS: OpenAiTool[] = [
  {
    type: "function",
    function: {
      name: "getMyUpcomingSession",
      description:
        "Read the authenticated user's next session. A patient sees their own session; a PSM sees their agenda. Never invent a session.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "quoteTherapyInWmxn",
      description:
        "Quote the standard therapy price in wMXN. The adapter owns the price and FX rate.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyWalletBalance",
      description:
        "Read the authenticated user's wMXN / USDT / CELO balances from the host adapter.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyPaymentStatus",
      description: "Read the escrow/payment status for one of the user's sessions.",
      parameters: {
        type: "object",
        properties: { sessionId: { type: "string" } },
        required: ["sessionId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createTherapyEscrowForMySession",
      description:
        "Prepare the escrow deposit link for one of the user's existing sessions. Does not sign or move funds; the user signs.",
      parameters: {
        type: "object",
        properties: { sessionId: { type: "string" } },
        required: ["sessionId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyRipioRampLink",
      description:
        "Return the Ripio on-ramp link so the user can buy wMXN with local money.",
      parameters: {
        type: "object",
        properties: { amountWmxn: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepareTransfer",
      description:
        "Prepare a wMXN/USDT/CELO transfer to a .motus name, the user's therapist, a Hub user confirmed by the adapter, or an explicit 0x address. Never invent an address; the user signs.",
      parameters: {
        type: "object",
        properties: {
          recipient: { type: "string" },
          amount: { type: "string" },
          token: { type: "string", enum: ["wMXN", "USDT", "CELO"] },
        },
        required: ["recipient", "amount", "token"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyTherapistAvailability",
      description:
        "Return the current therapist's available slots. Call this first when the user wants to book; show options and ask before booking.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "bookTherapySession",
      description:
        "Book the slot the user chose and create its escrow. Only after the user explicitly chose a slotId from getMyTherapistAvailability.",
      parameters: {
        type: "object",
        properties: { slotId: { type: "string" } },
        required: ["slotId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createProductPayment",
      description:
        "Prepare a membership or Academy course payment. Ask Stripe vs crypto first. Stripe returns a link; crypto returns a wMXN transfer to the treasury. Never choose the method or invent the price.",
      parameters: {
        type: "object",
        properties: {
          product: { type: "string", enum: ["membership", "course"] },
          courseSlug: { type: "string" },
          method: { type: "string", enum: ["stripe", "crypto"] },
        },
        required: ["product", "method"],
      },
    },
  },
];

export async function executePaymentTool(
  name: PaymentToolName,
  args: Record<string, unknown>,
  session: MottySession,
): Promise<{ result: ToolResult; session: MottySession }> {
  const str = (key: string) =>
    typeof args[key] === "string" ? (args[key] as string).trim() : "";

  const run = (
    fn: (adapter: MottyPaymentsAdapter, userId: string) => Promise<unknown>,
  ) =>
    runPayment(name, session, async (adapter, userId) => {
      const value = await fn(adapter, userId);
      return value as Awaited<ReturnType<MottyPaymentsAdapter["getUpcomingSession"]>>;
    });

  switch (name) {
    case "getMyUpcomingSession":
      return { session, result: await run((a, u) => a.getUpcomingSession(u)) };
    case "quoteTherapyInWmxn":
      return { session, result: await run((a, u) => a.quoteTherapy(u)) };
    case "getMyWalletBalance":
      return { session, result: await run((a, u) => a.getWalletSnapshot(u)) };
    case "getMyPaymentStatus": {
      const sessionId = str("sessionId");
      if (!sessionId) return { session, result: missing(name, "sessionId") };
      return {
        session,
        result: await run((a, u) => a.getPaymentStatus(u, sessionId)),
      };
    }
    case "createTherapyEscrowForMySession": {
      const sessionId = str("sessionId");
      if (!sessionId) return { session, result: missing(name, "sessionId") };
      return {
        session,
        result: await run((a, u) => a.createEscrow(u, sessionId)),
      };
    }
    case "getMyRipioRampLink": {
      const amount = str("amountWmxn") || undefined;
      return {
        session,
        result: await run((a, u) => a.getRampLink(u, amount)),
      };
    }
    case "prepareTransfer": {
      const recipient = str("recipient");
      const amount = str("amount");
      const token = str("token");
      if (!recipient || !amount || !token) {
        return { session, result: missing(name, "recipient/amount/token") };
      }
      return {
        session,
        result: await run((a, u) =>
          a.prepareTransfer(u, { recipient, amount, token }),
        ),
      };
    }
    case "getMyTherapistAvailability":
      return {
        session,
        result: await run((a, u) => a.getTherapistAvailability(u)),
      };
    case "bookTherapySession": {
      const slotId = str("slotId");
      if (!slotId) return { session, result: missing(name, "slotId") };
      return {
        session,
        result: await run((a, u) => a.bookTherapySession(u, slotId)),
      };
    }
    case "createProductPayment": {
      const product = str("product");
      const method = str("method");
      const courseSlug = str("courseSlug") || undefined;
      if (
        (product !== "membership" && product !== "course") ||
        (method !== "stripe" && method !== "crypto")
      ) {
        return { session, result: { ok: false, tool: name, error: "product_or_method_invalid" } };
      }
      return {
        session,
        result: await run((a, u) =>
          a.createProductPayment(u, {
            product,
            courseSlug,
            method,
          }),
        ),
      };
    }
    default:
      return { session, result: { ok: false, tool: name, error: "tool_unknown" } };
  }
}

async function runPayment(
  tool: string,
  session: MottySession,
  call: (adapter: MottyPaymentsAdapter, userId: string) => Promise<unknown>,
): Promise<ToolResult> {
  const adapter = getMottyPaymentsAdapter();
  if (!adapter) return { ok: false, tool, error: "payments_not_configured" };
  if (!session.userId) return { ok: false, tool, error: "auth_required" };

  try {
    const outcome = (await call(adapter, session.userId)) as
      | { ok: true; data: unknown }
      | { ok: false; error: string };
    if (!outcome || typeof outcome !== "object" || !("ok" in outcome)) {
      return { ok: false, tool, error: "invalid_adapter_result" };
    }
    if (!outcome.ok) return { ok: false, tool, error: outcome.error };
    return { ok: true, tool, data: outcome.data };
  } catch {
    return { ok: false, tool, error: "payments_unavailable" };
  }
}

function missing(tool: string, field: string): ToolResult {
  return { ok: false, tool, error: `missing_${field}` };
}
