# Motty Pay

**An installable payment agent for local stablecoins on Celo.** `@motusdao/motty`
is a small TypeScript package you mount inside your own product: the agent talks
to your database, your chain client and your user's wallet through adapters, so
it runs where the money and the user already are — no separate agent
infrastructure, no custodian, no key storage.

```bash
npm install github:Motus-DAO/motty-agent
```

```ts
import { createMottyChatHandler } from '@motusdao/motty/next'
import { configureMottyPayments } from '@motusdao/motty'

configureMottyPayments(myAdapter) // your DB, your chain, your wallet
export const POST = createMottyChatHandler({ enabledTools: [...PAYMENT_ENABLED_TOOLS] })
```

| You install | You get | You still own |
| --- | --- | --- |
| `createMottyChatHandler()` | the agent loop + tool runtime inside your Next.js app | auth, DB, RPC, keys |
| `MottyPaymentsAdapter` | 10 payment/booking tools wired to your logic | every signature |
| `MottyWidget` | chat UI + typed action cards (`transfer`, `escrow`, `stripe`) | the design system |
| `src/chain/` | Celo escrow + ERC-8021 helpers | the contract deployment |

The agent never signs and never holds funds. It prepares a typed action; the
host renders it and the user signs.

## Reference deployment: MotusDAO Hub

Motty Pay is the payment agent inside **MotusDAO Hub**, a therapy platform for
Latin America. It is not a separate bot or a back-office automation: it is a
lightweight agent embedded in the product, mounted in the Hub shell on every
page, with a server-side tool runtime inside the same Next.js application. There
is no separate agent infrastructure, no custodian, and no key storage. The agent
runs where the money and the user already are.

The agent understands the page and the user's role. A patient can say "book
another session with my therapist"; a professional can ask "what's on my agenda?".
Motty resolves the intent, calls the right tools, and returns either an answer or
a typed action that the interface renders as an in-chat card.

### What the agent can do

| Capability | What happens |
| --- | --- |
| **Book therapy** | Fetches the therapist's real availability, shows date/time options, asks which one, then creates the session and its escrow |
| **Charge and settle in wMXN** | Prepares the escrow deposit, the patient signs, the professional confirms, the settlement agent releases the 90/10 split on Celo |
| **Pay people** | "Send 1 wMXN to John" resolves a `.motus` name, a Hub display name, "my therapist", or an explicit address — and confirms the human match before creating the payment |
| **Pay the treasury** | Memberships and Academy courses, Stripe or crypto; crypto is converted to the wMXN equivalent and sent to the DAO treasury |
| **Use the Ripio ramp** | Returns the on-ramp link so a patient can buy wMXN with local money |
| **See status** | Session, escrow state, balances and payment history |

*Provenance: extracted from three near-copies in `LandingMotus` (public guide +
funnel tools), `PD-MD-LandingA` (Academia funnel) and `motusdao-hub`
(authenticated companion + Prisma progress).*

## Agents on Open Rails — Stable Agents: LatAm (submission)

**Motty Pay** books, charges and settles therapy in Mexican pesos on Celo. The
patient tops up with Ripio's ramp, the deposit sits in an onchain escrow in
**wMXN**, and the agent releases 90% to the psychologist and 10% to the DAO
treasury on its own.

| What | Where |
| --- | --- |
| Live product | <https://app.motusdao.org> — `/pagar/<id>`, `/pagos/historial`, `/finanzas/actividad` |
| This repo (forkable SDK) | <https://github.com/Motus-DAO/motty-agent> |
| Agent identity (ERC-8004) | agentId **10066** (tagged registration) · <https://8004scan.io> |
| Attribution (ERC-8021) | `celo_0ee3486819c5` on every Celo tx |

### Rails (Celo mainnet, 42220)

| Piece | Address / value |
| --- | --- |
| wMXN (Ripio) | `0x337E7456B420bD3481e7FA61fA9850343d610d34` |
| USDT (Celo) | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` |
| TherapyEscrow | `0xFd9F38AD6143B018e60F86B5304C53223FBf2dBC` (block `82227556`) |
| DAO treasury | `0xf229F3Dcea3D7cd3cA5ca41C4C50135D7b37F2b9` |
| Settlement agent | `0xb3C5EA7E583FBa073006c6C553239daC59e3d47B` |

### E2E #1 — 1 wMXN therapy session, released 90/10

Escrow id `0x3f92c51291a5a31b5edec0692f41b7e54f561605c6357bdb6ddd0b82a448d4cd`
· patient `0xD7dcF535f4159C18E252fF759bA2B14A1e91a2e0`
· professional `0xd0563BBa8E42b6ab0ECDfc1f0eA1486c5C28Ba3b`
· `startsAt` `1794129913` · challenge window `0`

| Step | Tx | Block |
| --- | --- | --- |
| `createSession` | `0x742fc9f206c2df76a842e2cc8cce66861b43fb8473d6090259e7421fb5d04495` | 82228557 |
| `deposit` | `0x4afe8bfc10e32567d1ef319864625aeb6f8340f78baf0c970eda4d9a845c28cd` | 82229730 |
| `settle` | `0x1395ee7c0243d88e8e8e3f8c80a255e4bd656bd59f6610a8000536a74d56cb07` | 82229919 |
| `release` | `0x58dc83f65a2de9ec9672377f88c1c20682cb33046a5ed8aa7b53c0cb64422853` | 82230063 |

`release` moved **0.9 wMXN** to the professional and **0.1 wMXN** to the
treasury; the escrow ends `Released`.

### E2E #2 — 10 wMXN therapy session

Escrow id `0xa43437802d1594d9661ab01d36be0ccf7c3a2eca08bde5ac8949ebe1d2b5c05d`
· amount **10 wMXN** · `startsAt` `1794177664` · challenge window `0`

| Step | Tx | Block |
| --- | --- | --- |
| `createSession` | `0x58d93ff488e2faa8c4532123ae8f673f8f1b61aba31db463677496dc08b6aec4` | 82276848 |
| `deposit` | `0x69b8435beaf7ef828ccc2b757345598e86fb260e3b587ebf6c35cd0132a24063` | 82277798 |
| `settle` | `0x962546de57a5285f11450ca9accd05fcc1952113d34a229c81e7dd63a59f52df` | 82278171 |
| `release` | `0xc158a1d6283448efde101028a067b91aebf91955883f5292ac8c585efe74fc0b` | 82278287 |

`release` moved **9.0 wMXN** to the professional and **1.0 wMXN** to treasury.

### More escrows on the same contract

| Amount | Escrow id · create · deposit |
| --- | --- |
| 10 wMXN | `0xe9ef01c1a2c3cbb5cc8d2f8a377b69748fb12a24080238ea25f8e2760fee223f` · `0xbfa4766d91367425e31699d3b26412cb40a4065c6dccaa22b964b94eaea6bdb2` · `0x9ba3630cb647496577514663373d72e6584864bb30e572af0949ce31e0742ca1` |
| 10 wMXN | `0x01f13523370c36255213b8a912e6cca6951967f1b0922ff3297067a78d401ce0` · `0x59c7c2e79fab9a5a37ba949a49e4939c1f4227b46eebd6c7a0cbe3e07dd3d7bc` · `0xcaa11d639fefe779773ca6d2ce4e7f229c5f1c9f46f114f32c4a6544727a373b` |
| 832.5 wMXN (45 USD @ 18.5) | `0x129ef4591a9a92ff25ba40b77c5ea7e4012cd6219623b1d06d1c8a0602dd69c9` · `0x4c0980cf71213546406f73344fc6ea7c132ac1b954877f018e37c5f85cc5e8b2` |

### Ripio ramp · ERC-8004 · ERC-8021

- **On-ramp:** 50 wMXN bought through Ripio on an iPhone. The wMXN landed on
  Celo mainnet and was funded into the patient wallet in verifiable transfers
  (40 wMXN `0x37882fe7…0d834`, 23 wMXN `0xabeaf84a…60e9`). The SDK exposes
  `getMyRipioRampLink` so the agent can hand a prefilled ramp URL to the patient.
- **Identity:** agent **10066**, registered via ERC-8004 **with the attribution
  tag inside the calldata** — tx
  `0x7a3bed756204cc9b83b2a818a3a3efe7bb5873a429363b98469efbb6111ae686`.
  First identity `10053` (`0x2d01e591…13ac`) predates the tag. Metadata:
  <https://app.motusdao.org/agent.json>.
- **Attribution:** `celo_0ee3486819c5` appended to the calldata of every Celo tx
  (`attributionSuffix()`); `hasAttribution()` verifies it. Coverage on the
  escrow contract, measured over all its logs:

  | Metric | Value |
  | --- | --- |
  | Transactions touching `TherapyEscrow` | 17 |
  | Of those, carrying the tag | **15** (the 2 without are contract deploy + ownership transfer) |
  | Sessions created | 6 (`1`, `832.5`, `10`, `10`, `10`, `832.5` wMXN) |
  | Deposited | **31 wMXN** |
  | Released | **11 wMXN** → 9.9 to payees, 1.1 to treasury |

### Why it scores (LatAm rubric)

| Criterion | How |
| --- | --- |
| Mainnet, real wFIAT | Full escrow lifecycle on Celo mainnet with wMXN (18 decimals), twice, plus three more escrows |
| Real use of wMXN + Celo stack | wMXN is the unit of account *and* settlement; ERC-8004 identity; ERC-8021 on every tx; gas in CELO |
| Agent autonomy | `agent:tick` worker reads escrow state and sends `settle` + `release` itself; runs on a 2-minute cron, no human click |
| UX for a real person | Ripio ramp on mobile → `/pagar/<id>` status page → history with hashes and receipts → `/finanzas/actividad` |
| LatAm impact | Therapy priced, paid and settled in pesos; the psychologist is paid in wMXN, never converted to USD |

### Autonomy

The release transactions above were sent by the settlement agent
`0xb3C5…d47B`, not by a person pressing a button in a dashboard: the worker
scans escrows, checks `startsAt` + challenge window, then calls `settle` and
`release`. It runs on the Hub as `npm run agent:tick` behind a 2-minute cron;
the chain client it uses is [`src/chain/escrow.ts`](src/chain/escrow.ts) here.

**Scope honesty:** the volume above is our own end-to-end runs against the live
contract — reproducible with the snippet in [Verify it yourself](#verify-it-yourself).
Independent patient acquisition is the next milestone, not something claimed here.

### Verify it yourself

No API key, no database: read the contract straight from Celo mainnet.

```bash
npm install
npm test    # 6/6 — payments tools + action cards
```

```ts
import { readEscrow, splitEscrow } from "@motusdao/motty";

const escrow = await readEscrow(
  "0x3f92c51291a5a31b5edec0692f41b7e54f561605c6357bdb6ddd0b82a448d4cd",
);
// status: 5 (Released), amount: 1e18n, patient 0xD7dc…, payee 0xd056…

splitEscrow(1_000_000_000_000_000_000n);
// { payee: 900000000000000000n, fee: 100000000000000000n }
```

Cross-check any hash on Celoscan:
`https://celoscan.io/tx/<hash>` — the ERC-8021 suffix
`celo_0ee3486819c5` is in the calldata.

## Package surface

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

The full evidence is above, in
[Agents on Open Rails — submission](#agents-on-open-rails--stable-agents-latam-submission):
rails, escrow ids, every tx hash, 90/10 splits, ERC-8004 identity, ERC-8021
attribution and the Ripio ramp. The extended ledger (more escrows, blocks,
ownership transfer) is in [`docs/PROOF.md`](docs/PROOF.md); the contract source
is [`contracts/TherapyEscrow.sol`](contracts/TherapyEscrow.sol).

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
