# Submission — Agents on Open Rails (Stable Agents: LatAm)

Paste-ready answers for the Loops House form. Everything here is backed by
[`docs/PROOF.md`](./PROOF.md) and the README.

## Form fields

| Field | Value |
| --- | --- |
| Project name | **Motty Pay** |
| Track | Stable Agents: LatAm (Ripio × Celo Core Co.) |
| Repo | <https://github.com/Motus-DAO/motty-agent> |
| Live product | <https://app.motusdao.org> |
| Agent wallet | `0xb3C5EA7E583FBa073006c6C553239daC59e3d47B` |
| ERC-8004 agentId | `10066` (registered with the tag; first identity `10053` predates it) |
| ERC-8021 tag | `celo_0ee3486819c5` |
| Contract | `0xFd9F38AD6143B018e60F86B5304C53223FBf2dBC` (Celo mainnet) |
| A2A endpoint | <https://motty.motusdao.org/> |
| Agent card | <https://motty.motusdao.org/.well-known/agent-card.json> |
| MCP (HTTP) | <https://motty.motusdao.org/mcp> |
| npm | `@motusdao/motty@0.1.1` |

## One-liner

An installable payment agent that books, charges and settles therapy in wMXN on
Celo — no custodian, no key storage, no USD round-trip.

## Short description (~300 chars)

Motty Pay is a TypeScript package you mount inside your product: a chat agent and
a tool runtime that pay people, book sessions and settle escrows in local
stablecoins on Celo. Reference deployment: MotusDAO Hub, where patients pay
therapists in wMXN through a 90/10 onchain escrow.

## Full description (repo)

**Motty Pay is a TypeScript package (`@motusdao/motty`) you mount inside your own
product.** It ships an agent loop, a server-side tool runtime and a typed-action
UI layer; you inject your database, chain client and wallet through adapters.
One dependency, no separate runtime, no custodian, no key storage: the agent
prepares a typed action (`transfer`, `escrow`, `stripe`), your interface renders
it, and the user signs.

**It runs on four surfaces:** the in-app chat widget, a Next.js route handler,
**MCP** over stdio and HTTP (`https://motty.motusdao.org/mcp`, `tools/list` and
`tools/call` on the same 11 tools, for Claude Desktop, Cursor or any
orchestrator) and **A2A** over HTTP (`https://motty.motusdao.org/`, agent card at
`/.well-known/agent-card.json`).

**Reference deployment: MotusDAO Hub**, a therapy platform for Latin America.
The agent is embedded in the Hub shell on every page, understands the page and
the user's role, and books, charges and settles therapy in **wMXN** through a
90/10 escrow on Celo mainnet. A patient says "book another session with my
therapist"; a professional asks "what's on my agenda?"; Motty resolves the
intent, calls the tools and returns an answer or a signable card.

**What it does**

- Books from the therapist's real availability, then creates the session and its
  escrow.
- Charges and settles in wMXN: the patient signs the deposit, the professional
  confirms, the settlement agent releases the 90/10 split.
- Pays people by `.motus` name, Hub display name, "my therapist" or an explicit
  address, confirming the human match first.
- Pays the DAO treasury for memberships and Academy courses, Stripe or crypto.
- Returns the Ripio on-ramp link to buy wMXN with local money.
- Reports session, escrow and balance status.

## Copy-paste — single field

Everything below is one block; it is the version to paste when the form has a
single description box.

> **Motty Pay is a TypeScript package (`@motusdao/motty`) you mount inside your
> own product.** It ships an agent loop, a server-side tool runtime and a
> typed-action UI layer; you inject your database, chain client and wallet
> through adapters. One dependency, no separate runtime, no custodian, no key
> storage: the agent prepares a typed action (`transfer`, `escrow`, `stripe`),
> your interface renders it, and the user signs.
>
> **It runs on four surfaces:** the in-app chat widget, a Next.js route handler,
> **MCP** over stdio and HTTP (`https://motty.motusdao.org/mcp`, `tools/list` and
> `tools/call` on the same 11 tools, for Claude Desktop, Cursor or any
> orchestrator) and **A2A** over HTTP (`https://motty.motusdao.org/`, agent card
> at `/.well-known/agent-card.json`).
>
> **Reference deployment: MotusDAO Hub**, a therapy platform for Latin America.
> The agent is embedded in the Hub shell on every page, understands the page and
> the user's role, and books, charges and settles therapy in **wMXN** through a
> 90/10 escrow on Celo mainnet. A patient says "book another session with my
> therapist"; a professional asks "what's on my agenda?"; Motty resolves the
> intent, calls the tools and returns an answer or a signable card.
>
> **What it does:** books from the therapist's real availability and creates the
> session with its escrow · charges and settles in wMXN (patient signs,
> professional confirms, the settlement agent releases 90/10) · pays people by
> `.motus` name, Hub display name, "my therapist" or address · pays the DAO
> treasury for memberships and courses, Stripe or crypto · returns the Ripio
> on-ramp link · reports session, escrow and balance status.
>
> **Proof, verifiable onchain:** ERC-8004 agentId **10066**, registered with the
> ERC-8021 tag inside the calldata (`0x7a3bed75…e686`). **15 of the 17**
> transactions touching the escrow contract carry `celo_0ee3486819c5` — the two
> exceptions are the contract deploy and the ownership transfer. 6 sessions
> created, **31 wMXN deposited**, **11 wMXN released** 90/10 across two complete
> `create → deposit → settle → release` cycles.
>
> Install: `npm install @motusdao/motty`.
> Repo: https://github.com/Motus-DAO/motty-agent · Product: https://app.motusdao.org

### Short variant (~150 words)

> Motty Pay is an installable TypeScript package (`@motusdao/motty`) that turns
> any product into an agent that can pay. You inject your database, chain client
> and wallet through adapters; it prepares typed actions and the user signs. It
> runs as a chat widget, a Next.js route, MCP over stdio/HTTP and A2A over HTTP
> (`https://motty.motusdao.org`, 11 tools, live agent card).
>
> Reference deployment: MotusDAO Hub, where patients book and settle therapy in
> wMXN through a 90/10 escrow on Celo. ERC-8004 agentId 10066 registered with the
> ERC-8021 tag in the calldata; 15 of 17 escrow transactions carry
> `celo_0ee3486819c5`; 6 sessions, 31 wMXN deposited, 11 wMXN released.
>
> Repo: https://github.com/Motus-DAO/motty-agent

## Proof (Celo mainnet, 42220)

Five escrows; two complete `create → deposit → settle → release` cycles.

| What | Value |
| --- | --- |
| 1 wMXN cycle | escrow `0x3f92c5…d4cd` · `create` `0x742fc9…4495` · `deposit` `0x4afe8b…28cd` · `settle` `0x1395ee…cb07` · `release` `0x58dc83…2853` |
| Release split | 0.9 wMXN to the psychologist, 0.1 wMXN to the DAO treasury |
| 10 wMXN cycle | escrow `0xa43437…c05d` · `create` `0x58d93f…aec4` · `deposit` `0x69b843…4063` · `settle` `0x962546…f52df` · `release` `0xc158a1…fc0b` |
| More escrows | 10 + 10 + 832.5 wMXN (45 USD @ 18.5) on the same contract |
| Agent identity | ERC-8004 `10066`, registration `0x7a3bed75…e686` (tag in calldata) |
| Attribution coverage | 15 of 17 escrow txs tagged · 31 wMXN deposited · 11 wMXN released |
| Attribution | `celo_0ee3486819c5` on every Celo transaction |
| Ramp | 50 wMXN bought through Ripio's on-ramp on a phone |

Full hashes, blocks and addresses: [`docs/PROOF.md`](./PROOF.md) and the README.

## Autonomy

The release transactions were sent by the settlement agent `0xb3C5…d47B`, not by
a person clicking a button: a worker reads escrow state, checks `startsAt` and
the challenge window, then calls `settle` and `release` on a two-minute cron.

## Rubric mapping

| Criterion | How it is met |
| --- | --- |
| Mainnet, real wFIAT | Full escrow lifecycle on Celo mainnet with wMXN (18 decimals), twice |
| Real use of wMXN + Celo | wMXN is the unit of account *and* settlement; ERC-8004 identity; ERC-8021 tags; gas in CELO |
| Agent is autonomous and useful | Settlement worker releases without a human; the chat agent resolves intent and calls tools |
| A real person can use the UX | Ripio ramp on mobile → `/pagar/<id>` → history with hashes and receipts |
| Impact for LatAm | Therapy priced, paid and settled in pesos; the psychologist is never converted to USD |

## Scope honesty

Volume today is our own end-to-end runs against the live contract, reproducible
with the snippet in the README. Independent patient acquisition is the next
milestone, not something claimed here.
