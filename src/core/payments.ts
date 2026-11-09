import type { MottyAction } from "./types.js";

/**
 * Outcome returned by a host payments adapter. `data` is the host-computed
 * object; if it has a `kind` of transfer/escrow/stripe it becomes an in-chat
 * action. The SDK never signs, holds keys or invents prices/addresses.
 */
export type MottyPaymentOutcome =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export type MottyTransferInput = {
  recipient: string;
  amount: string;
  token: string;
};

export type MottyProductInput = {
  product: "membership" | "course";
  courseSlug?: string;
  method: "stripe" | "crypto";
};

/**
 * Implement these against your own database, chain and wallet stack.
 * Motty only orchestrates; the host resolves sessions, prices and addresses.
 */
export type MottyPaymentsAdapter = {
  getUpcomingSession(userId: string): Promise<MottyPaymentOutcome>;
  quoteTherapy(userId: string): Promise<MottyPaymentOutcome>;
  getWalletSnapshot(userId: string): Promise<MottyPaymentOutcome>;
  getPaymentStatus(userId: string, sessionId: string): Promise<MottyPaymentOutcome>;
  createEscrow(userId: string, sessionId: string): Promise<MottyPaymentOutcome>;
  getRampLink(userId: string, amountWmxn?: string): Promise<MottyPaymentOutcome>;
  getTherapistAvailability(userId: string): Promise<MottyPaymentOutcome>;
  bookTherapySession(userId: string, slotId: string): Promise<MottyPaymentOutcome>;
  prepareTransfer(
    userId: string,
    input: MottyTransferInput,
  ): Promise<MottyPaymentOutcome>;
  createProductPayment(
    userId: string,
    input: MottyProductInput,
  ): Promise<MottyPaymentOutcome>;
};

let paymentsAdapter: MottyPaymentsAdapter | null = null;

/** Install the host adapter. Call once at startup (or per request in serverless). */
export function configureMottyPayments(
  adapter: MottyPaymentsAdapter | null,
): void {
  paymentsAdapter = adapter;
}

export function getMottyPaymentsAdapter(): MottyPaymentsAdapter | null {
  return paymentsAdapter;
}

export function isMottyAction(value: unknown): value is MottyAction {
  if (!value || typeof value !== "object") return false;
  const kind = (value as { kind?: unknown }).kind;
  return kind === "transfer" || kind === "escrow" || kind === "stripe";
}
