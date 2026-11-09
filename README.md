# @motusdao/motty

Reusable **Motty** agent for MotusDAO apps: lightweight in-process guide that answers from Motus Knowledge MCP, can run a conversion funnel (lead → offer → deep-link checkout → handoff), and supports **per-person auth + learning progress** via host adapters.

Extracted from the three near-copies in:

- `LandingMotus` — public ecosystem guide + funnel tools (stubbed)
- `PD-MD-LandingA` — Academia funnel via prompt
- `motusdao-hub` — authenticated Hub companion + Prisma progress

## What you get

| Layer | Import | Contents |
|-------|--------|----------|
| Core | `@motusdao/motty` | agent loop, MCP client, namespaces allowlist, HMAC session cookie, Venice provider, tools |
| Next | `@motusdao/motty/next` | `createMottyChatHandler()` for `POST /api/motty/chat` |
| React | `@motusdao/motty/react` | `MottyWidget`, `MottyAvatar`, `MottyMarkdown` |
| Assets | `assets/motty/` | gif + still — copy to host `public/motty/` |

Motty is **not** MotusAI / PsyChat / OpenClaw. Public runtime is always `in-process-loop`.

## Install

```bash
# from another Motus repo (path / git)
npm install ../Agents/motty-agent
# or
npm install git+ssh://git@github.com/MotusDAO/motty-agent.git
```

Peer deps (when using UI / Next route): `next`, `react`, `react-dom`, `react-markdown`, `lucide-react`.

Copy assets:

```bash
cp -R node_modules/@motusdao/motty/assets/motty public/motty
```

Env: see [`.env.example`](./.env.example).

## Public landing (anonymous)

```ts
// app/api/motty/chat/route.ts
import { cookies } from 'next/headers'
import { createMottyChatHandler } from '@motusdao/motty/next'

export const runtime = 'nodejs'
export const POST = createMottyChatHandler({
  config: { cookieName: 'motty_session', mcpClientName: 'motty-my-landing' },
  getCookieJar: async () => cookies(),
})
```

```tsx
// app/layout.tsx
import { MottyWidget } from '@motusdao/motty/react'
import '@motusdao/motty/styles.css'

<MottyWidget
  locale="es"
  delayedReveal
  copy={{
    title: 'Motty',
    subtitle: 'Guía del ecosistema MotusDAO',
    greeting: 'Hola — soy Motty. ¿Buscas Hub, Academia o Agents?',
    disclaimer: 'No soy terapeuta ni MotusAI.',
    crisis: 'Si estás en crisis, contacta emergencias locales.',
    placeholder: 'Escribe tu pregunta…',
    send: 'Enviar',
    close: 'Cerrar',
    fab: 'Abrir Motty',
    thinking: 'Pensando…',
    error: 'No pude responder. Intenta de nuevo.',
    rateLimit: 'Demasiados mensajes. Espera un momento.',
  }}
/>
```

## Authenticated + DB progress (Hub-style)

```ts
export const POST = createMottyChatHandler({
  config: { cookieName: 'motty_hub_apd_session', mcpClientName: 'motty-hub' },
  resolveAuth: async (request) => {
    const userId = await yourRequireSession(request) // server-verified
    return { mode: 'authenticated', userId }
  },
  loadLearningContext: async (userId) => {
    // Query YOUR DB; return { userId, currentRouteStage, summary }
    return yourLoadProgress(userId)
  },
  systemPrompt: (locale, { pagePath }) => hubCompanionPrompt(locale, { pagePath }),
  getCookieJar: async () => cookies(),
})
```

- Cookie is bound to `userId`; mismatch resets the session.
- Client body never supplies `userId`.
- Learning context is injected as a second system message; foreign `userId` is dropped.

## Funnel tools

Default enabled: `searchKnowledge` only.

Schemas for lead / offer / checkout / handoff ship in the package — enable without rewriting the loop:

```ts
createMottyChatHandler({
  enabledTools: [
    'searchKnowledge',
    'updateCurrentLead',
    'getRecommendedOffer',
    'createCheckout',
    'createAccount',
    'handoffToHuman',
  ],
  // …
})
```

Checkout v1 = **deep links**, not a payments API. Handoff via `MOTTY_HANDOFF_*` env.

## Knowledge allowlist

Server-side only: `brand`, `product`. Internal namespaces → `namespace_not_allowed` (never retried against MCP).

## Layout

```
src/
  core/       config, mcp, session, agent-loop, provider, …
  tools/      searchKnowledge + funnel tools
  presets/    public + hub system prompts
  next/       createMottyChatHandler
  react/      MottyWidget, Avatar, Markdown, CSS
assets/motty/
examples/
```

## Scripts

```bash
npm install
npm run build
npm test
```

## Sources

Canonical product notes: `LandingMotus/docs/MOTTY.md`.


---

## On-chain proof

The real Celo mainnet E2E — contracts, escrow ids, full tx hashes, 90/10
amounts, ERC-8004 identity, ERC-8021 attribution and Ripio ramp — lives in
[`docs/PROOF.md`](docs/PROOF.md). The escrow source is in
[`contracts/TherapyEscrow.sol`](contracts/TherapyEscrow.sol).

## Payments, booking and in-chat actions

The SDK ships **10 payment/booking tools** on top of the knowledge/funnel tools. They are opt-in and require a host adapter:

| Tool | What it does |
| --- | --- |
| `getMyUpcomingSession` | Patient's next session, or a PSM's agenda |
| `quoteTherapyInWmxn` | Therapy quote in wMXN |
| `getMyWalletBalance` | wMXN / USDT / CELO balances |
| `getMyPaymentStatus` | Escrow status for a session |
| `createTherapyEscrowForMySession` | Prepare the deposit link |
| `getMyRipioRampLink` | Ripio on-ramp link |
| `prepareTransfer` | `.motus`, therapist, confirmed Hub user or `0x` |
| `getMyTherapistAvailability` | Available slots |
| `bookTherapySession` | Book the chosen slot + escrow |
| `createProductPayment` | Membership/course, Stripe or crypto |

### Host adapter

```ts
import { configureMottyPayments, type MottyPaymentsAdapter } from "@motusdao/motty";

const payments: MottyPaymentsAdapter = {
  async getUpcomingSession(userId) { /* read your DB */ },
  async quoteTherapy(userId) { /* your price/FX */ },
  async getWalletSnapshot(userId) { /* your chain */ },
  async getPaymentStatus(userId, sessionId) { /* your escrow */ },
  async createEscrow(userId, sessionId) { /* prepare only */ },
  async getRampLink(userId, amount) { /* Ripio link */ },
  async getTherapistAvailability(userId) { /* slots */ },
  async bookTherapySession(userId, slotId) { /* session + escrow */ },
  async prepareTransfer(userId, input) { /* resolve recipient */ },
  async createProductPayment(userId, input) { /* Stripe/crypto */ },
};

configureMottyPayments(payments);
```

Each method returns `{ ok: true, data }` or `{ ok: false, error }`. If `data.kind` is `transfer`, `escrow` or `stripe`, the SDK includes it in the turn's `actions` array and the widget renders an action card.

### Next.js handler

```ts
import { createMottyChatHandler } from "@motusdao/motty/next";
import {
  DEFAULT_ENABLED_TOOLS,
  PAYMENT_ENABLED_TOOLS,
  paymentsPrompt,
} from "@motusdao/motty";
import { createMockPaymentsAdapter } from "@motusdao/motty/mock";

const handler = createMottyChatHandler({
  enabledTools: [...DEFAULT_ENABLED_TOOLS, ...PAYMENT_ENABLED_TOOLS],
  systemPrompt: (locale) => paymentsPrompt(locale),
  payments: createMockPaymentsAdapter(), // replace with your adapter
  getCookieJar: async () => cookies(),
});
```

### Widget

```tsx
<MottyWidget
  copy={copy}
  onSignAction={async (action) => {
    // transfer: send wMXN/USDT/CELO
    // escrow: approve + deposit
    // stripe: redirect to action.url
  }}
/>
```

The SDK never holds keys, signs, or invents addresses/prices/slots. The host adapter resolves everything; the user signs in the wallet.

### Demo without infrastructure

```ts
import { createMockPaymentsAdapter } from "@motusdao/motty/mock";
configureMottyPayments(createMockPaymentsAdapter());
```

The mock returns deterministic sessions, slots, a transfer, an escrow and a Stripe/crypto product so anyone can fork the repo and see the flow end to end.
