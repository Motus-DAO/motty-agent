export type MottyLocale = "es" | "en";

export type MottyRole = "user" | "assistant";

export type MottyMessage = {
  role: MottyRole;
  content: string;
};

export type MottyAudience = "users" | "professionals" | "community" | "unknown";

export type MottyLead = {
  name?: string;
  email?: string;
  audience?: MottyAudience;
  intent?: string;
};

export type MottySession = {
  id: string;
  /** Present when auth mode binds the cookie to a server-verified user. */
  userId?: string;
  locale: MottyLocale;
  messages: MottyMessage[];
  lead: MottyLead;
  offerId?: string;
  handoff?: { at: string; reason?: string; channelId?: string };
  createdAt: string;
  updatedAt: string;
};

export type ToolResult = {
  ok: boolean;
  tool: string;
  data?: unknown;
  error?: string;
};

/** Injectable learning / progress snapshot (host app loads from its DB). */
export type MottyLearningContext = {
  userId: string;
  currentRouteStage?: string | null;
  summary: string;
};

export type MottyOffer = {
  id: string;
  audience: MottyAudience;
  href: string;
  labelEs: string;
  labelEn: string;
};


export type MottyAction =
  | {
      kind: "transfer";
      toName: string;
      toAddress: string;
      amount: string;
      token: string;
      link?: string;
    }
  | {
      kind: "escrow";
      payPath: string;
      escrowId?: string;
      sessionId?: string;
      amountWmxn: string;
      startsAt?: string | null;
      psmName?: string | null;
    }
  | {
      kind: "stripe";
      name: string;
      amountMxn: string;
      url: string;
      interval?: string;
    };
