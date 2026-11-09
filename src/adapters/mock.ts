import type { MottyPaymentsAdapter } from "../core/payments.js";

const NOW = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

/**
 * Demo adapter: lets the SDK run without a database, chain or wallet.
 * Replace with your host adapter in production.
 */
export function createMockPaymentsAdapter(): MottyPaymentsAdapter {
  return {
    async getUpcomingSession() {
      return {
        ok: true,
        data: {
          role: "patient",
          session: {
            sessionId: "demo-session",
            startsAt: NOW(),
            psmName: "Dra. Demo",
            status: "accepted",
          },
        },
      };
    },
    async quoteTherapy() {
      return {
        ok: true,
        data: { usd: 45, mxn: 832.5, wmxn: "832.50", rate: 18.5, source: "fixed" },
      };
    },
    async getWalletSnapshot() {
      return { ok: true, data: { wmxn: "100.00", usdt: "5.00", celo: "1.00" } };
    },
    async getPaymentStatus(_userId, sessionId) {
      return {
        ok: true,
        data: {
          sessionId,
          escrowId: "0x0000000000000000000000000000000000000000000000000000000000000001",
          status: 2,
          statusLabel: "Depositada",
          amountWmxn: "10.00",
        },
      };
    },
    async createEscrow(_userId, sessionId) {
      return {
        ok: true,
        data: {
          kind: "escrow",
          sessionId,
          escrowId: "0x0000000000000000000000000000000000000000000000000000000000000001",
          payPath: "/pagar/demo",
          amountWmxn: "10.00",
          startsAt: NOW(),
          psmName: "Dra. Demo",
        },
      };
    },
    async getRampLink() {
      return {
        ok: true,
        data: {
          url: "https://ramp.ripio.com/?country=MX&chain=42220&token=WMXN",
          token: "WMXN",
          country: "MX",
        },
      };
    },
    async getTherapistAvailability() {
      return {
        ok: true,
        data: {
          psmName: "Dra. Demo",
          slots: [
            { slotId: "demo-slot-1", startsAt: NOW(), durationMinutes: 50 },
            { slotId: "demo-slot-2", startsAt: NOW(), durationMinutes: 50 },
          ],
        },
      };
    },
    async bookTherapySession(_userId, slotId) {
      return {
        ok: true,
        data: {
          kind: "escrow",
          sessionId: `demo-${slotId}`,
          escrowId: "0x0000000000000000000000000000000000000000000000000000000000000002",
          payPath: "/pagar/demo-booking",
          amountWmxn: "10.00",
          startsAt: NOW(),
          psmName: "Dra. Demo",
        },
      };
    },
    async prepareTransfer(_userId, input) {
      return {
        ok: true,
        data: {
          kind: "transfer",
          toName: "John Talbot",
          toAddress: "0xd7dcf535f4159c18e252ff759ba2b14a1e91a2e0",
          amount: input.amount,
          token: input.token,
        },
      };
    },
    async createProductPayment(_userId, input) {
      if (input.method === "stripe") {
        return {
          ok: true,
          data: {
            kind: "stripe",
            name: input.product === "membership" ? "Membresía MotusDAO" : "Curso de Academia",
            amountMxn: "299.00",
            url: input.product === "membership" ? "/membresia" : "/academia/demo",
          },
        };
      }
      return {
        ok: true,
        data: {
          kind: "transfer",
          toName: "Tesorería MotusDAO",
          toAddress: "0xf229F3Dcea3D7cd3cA5ca41C4C50135D7b37F2b9",
          amount: "299.00",
          token: "wMXN",
        },
      };
    },
  };
}
