import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mottyConfig } from "./config.js";
import type { MottyLocale, MottyMessage, MottySession } from "./types.js";

const SESSION_VERSION = 1;

type CookiePayload = {
  v: number;
  id: string;
  userId?: string;
  locale: MottyLocale;
  messages: MottyMessage[];
  lead: MottySession["lead"];
  offerId?: string;
  handoff?: MottySession["handoff"];
  createdAt: string;
  updatedAt: string;
};

export type CookieJar = {
  get(name: string): { value: string } | undefined;
  set(
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: "lax" | "strict" | "none";
      secure: boolean;
      path: string;
      maxAge: number;
    },
  ): void;
};

export function createEmptySession(input: {
  locale: MottyLocale;
  userId?: string;
}): MottySession {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    userId: input.userId,
    locale: input.locale,
    messages: [],
    lead: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function decodeMottyCookie(raw: string): MottySession | null {
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  if (!verify(body, mac)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as CookiePayload;
    if (parsed.v !== SESSION_VERSION || !parsed.id) return null;
    return {
      id: parsed.id,
      userId: parsed.userId,
      locale: parsed.locale === "en" ? "en" : "es",
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      lead: parsed.lead ?? {},
      offerId: parsed.offerId,
      handoff: parsed.handoff,
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function encodeMottyCookie(session: MottySession): string {
  const payload: CookiePayload = {
    v: SESSION_VERSION,
    id: session.id,
    userId: session.userId,
    locale: session.locale,
    messages: session.messages,
    lead: session.lead,
    offerId: session.offerId,
    handoff: session.handoff,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readMottySessionFromJar(
  jar: CookieJar,
  input: { locale: MottyLocale; userId?: string },
): MottySession {
  const raw = jar.get(mottyConfig().cookieName)?.value;
  if (!raw) return createEmptySession(input);

  const parsed = decodeMottyCookie(raw);
  if (!parsed) return createEmptySession(input);

  // Auth binding: if host requires a userId, cookie must match or reset.
  if (input.userId && parsed.userId && parsed.userId !== input.userId) {
    return createEmptySession(input);
  }
  if (input.userId && !parsed.userId) {
    return createEmptySession(input);
  }

  return {
    ...parsed,
    userId: input.userId ?? parsed.userId,
    locale:
      parsed.locale === "en" || parsed.locale === "es"
        ? parsed.locale
        : input.locale,
    messages: capMessages(parsed.messages),
    lead: parsed.lead ?? {},
  };
}

export function writeMottySessionToJar(
  jar: CookieJar,
  session: MottySession,
): MottySession {
  const next: MottySession = {
    ...session,
    messages: capMessages(session.messages),
    updatedAt: new Date().toISOString(),
  };
  const { cookieName, cookieMaxAgeSec } = mottyConfig();
  jar.set(cookieName, encodeMottyCookie(next), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookieMaxAgeSec,
  });
  return next;
}

export function appendTurn(
  session: MottySession,
  user: string,
  assistant: string,
): MottySession {
  return {
    ...session,
    messages: capMessages([
      ...session.messages,
      { role: "user", content: user },
      { role: "assistant", content: assistant },
    ]),
  };
}

function capMessages(messages: MottyMessage[]): MottyMessage[] {
  const { maxHistory, maxStoredChars } = mottyConfig();
  return messages.slice(-maxHistory).map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: String(message.content ?? "").slice(0, maxStoredChars),
  }));
}

function secret(): string {
  const configured = mottyConfig().sessionSecret;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("MOTTY_SESSION_SECRET is required in production.");
  }
  return "motty-dev-session-secret";
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

function verify(body: string, mac: string): boolean {
  try {
    const expected = Buffer.from(sign(body));
    const actual = Buffer.from(mac);
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
