import type { MottyOffer } from "./types.js";

export type MottyConfig = {
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  mcpUrl: string;
  sessionSecret: string;
  maxToolRounds: number;
  maxHistory: number;
  maxMessageChars: number;
  maxStoredChars: number;
  cookieName: string;
  cookieMaxAgeSec: number;
  /** MCP clientInfo.name — helps distinguish landings vs hub in MCP logs. */
  mcpClientName: string;
  /** Default deep-link offer catalog (override per host app). */
  offers: readonly MottyOffer[];
};

export type MottyConfigInput = Partial<MottyConfig> & {
  /** Env overrides still apply when a field is omitted. */
  env?: NodeJS.ProcessEnv;
};

const DEFAULT_OFFERS: readonly MottyOffer[] = [
  {
    id: "wellness-hub",
    audience: "users",
    href: "https://hub.motusdao.org",
    labelEs: "Wellness Hub",
    labelEn: "Wellness Hub",
  },
  {
    id: "academia",
    audience: "professionals",
    href: "https://academia.motusdao.org",
    labelEs: "Academia",
    labelEn: "Academy",
  },
  {
    id: "agents",
    audience: "community",
    href: "https://agents.motusdao.org",
    labelEs: "Agents",
    labelEn: "Agents",
  },
  {
    id: "psychat",
    audience: "users",
    href: "https://psychat.motusdao.org",
    labelEs: "PsyChat / MotusAI",
    labelEn: "PsyChat / MotusAI",
  },
];

let active: MottyConfig | null = null;

export function resolveMottyConfig(input: MottyConfigInput = {}): MottyConfig {
  const env = input.env ?? process.env;
  const aiApiKey =
    input.aiApiKey ??
    (env.MOTTY_AI_API_KEY ||
      env.VENICE_API_KEY ||
      env.VENICE_INFERENCE_KEY ||
      env.OPENAI_API_KEY ||
      "");

  return {
    aiBaseUrl: (
      input.aiBaseUrl ??
      (env.MOTTY_AI_BASE_URL ||
        env.OPENAI_BASE_URL ||
        "https://api.venice.ai/api/v1")
    ).replace(/\/$/, ""),
    aiApiKey,
    aiModel: input.aiModel ?? (env.MOTTY_AI_MODEL || "deepseek-v4-flash-0731"),
    mcpUrl:
      input.mcpUrl ?? (env.MOTTY_MCP_URL || "https://mcp.motusdao.org/mcp"),
    sessionSecret:
      input.sessionSecret ??
      (env.MOTTY_SESSION_SECRET || env.AUTH_SECRET || ""),
    maxToolRounds: input.maxToolRounds ?? 3,
    maxHistory: input.maxHistory ?? 8,
    maxMessageChars: input.maxMessageChars ?? 2000,
    maxStoredChars: input.maxStoredChars ?? 360,
    cookieName: input.cookieName ?? "motty_session",
    cookieMaxAgeSec: input.cookieMaxAgeSec ?? 60 * 60 * 24 * 7,
    mcpClientName: input.mcpClientName ?? "motty-agent",
    offers: input.offers ?? DEFAULT_OFFERS,
  };
}

/** Configure package-wide defaults once at app boot (optional). */
export function configureMotty(input: MottyConfigInput): MottyConfig {
  active = resolveMottyConfig(input);
  return active;
}

export function mottyConfig(): MottyConfig {
  return active ?? resolveMottyConfig();
}

export function hasMottyInference(config: MottyConfig = mottyConfig()): boolean {
  return Boolean(config.aiApiKey);
}
