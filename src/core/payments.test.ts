import assert from "node:assert/strict";
import { test } from "node:test";
import { createMockPaymentsAdapter } from "../adapters/mock.js";
import { configureMottyPayments } from "./payments.js";
import { createEmptySession } from "./session.js";
import {
  ALL_MOTTY_TOOL_NAMES,
  PAYMENT_ENABLED_TOOLS,
  executeMottyTool,
} from "../tools/index.js";

test("payment tools are registered in the SDK", () => {
  for (const name of [
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
  ]) {
    assert.ok(
      (ALL_MOTTY_TOOL_NAMES as readonly string[]).includes(name),
      `${name} missing`,
    );
  }
});

test("prepareTransfer returns a transfer action", async () => {
  configureMottyPayments(createMockPaymentsAdapter());
  const session = createEmptySession({ userId: "demo-user", locale: "es" });
  const { result } = await executeMottyTool(
    "prepareTransfer",
    { recipient: "John", amount: "1", token: "wMXN" },
    session,
    PAYMENT_ENABLED_TOOLS,
  );
  assert.equal(result.ok, true);
  const data = result.data as { kind?: string; toName?: string };
  assert.equal(data.kind, "transfer");
  assert.equal(data.toName, "John Talbot");
});

test("bookTherapySession returns an escrow action", async () => {
  configureMottyPayments(createMockPaymentsAdapter());
  const session = createEmptySession({ userId: "demo-user", locale: "es" });
  const { result } = await executeMottyTool(
    "bookTherapySession",
    { slotId: "demo-slot-1" },
    session,
    PAYMENT_ENABLED_TOOLS,
  );
  assert.equal(result.ok, true);
  assert.equal((result.data as { kind?: string }).kind, "escrow");
});

test("payment tools require the host adapter", async () => {
  configureMottyPayments(null);
  const session = createEmptySession({ userId: "demo-user", locale: "es" });
  const { result } = await executeMottyTool(
    "getMyWalletBalance",
    {},
    session,
    PAYMENT_ENABLED_TOOLS,
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, "payments_not_configured");
});
