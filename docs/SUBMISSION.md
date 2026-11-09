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

## Full description

**Motty Pay — an installable payment agent for local stablecoins on Celo.**

Motty Pay is a TypeScript package (`@motusdao/motty`) you mount inside your own
product: a chat agent plus a server-side tool runtime that talks to your
database, your chain client and the user's wallet through adapters. One
dependency; no separate runtime, no custodian, no key storage. The agent
prepares typed actions — `transfer`, `escrow`, `stripe` — your interface renders
them and the user signs.

**Reference deployment: MotusDAO Hub.** Motty Pay is the payment agent inside
MotusDAO Hub, a therapy platform for Latin America. It is not a separate bot or a
back-office automation: it is a lightweight agent embedded in the product,
mounted in the Hub shell on every page, with the tool runtime inside the same
Next.js application. The agent runs where the money and the user already are.

The agent understands the page and the user's role. A patient can say "book
another session with my therapist"; a professional can ask "what's on my agenda?".
Motty resolves the intent, calls the right tools, and returns either an answer or
a typed action that the interface renders as an in-chat card.

**What it does**

- **Books therapy** — fetches the therapist's real availability, shows options,
  creates the session and its escrow.
- **Charges and settles in wMXN** — the patient signs the deposit, the
  professional confirms, the settlement agent releases the 90/10 split on Celo.
- **Pays people** — "Send 1 wMXN to John" resolves a `.motus` name, a Hub display
  name, "my therapist", or an explicit address, and confirms the human match.
- **Pays the treasury** — memberships and Academy courses, Stripe or crypto;
  crypto is converted to the wMXN equivalent and sent to the DAO.
- **Uses the Ripio ramp** — returns the on-ramp link to buy wMXN with local money.
- **Reports status** — session, escrow state, balances, payment history.

**Why it is a real agent, not a chat wrapper.** Ten payment/booking tools run
server-side in the host app, behind a signed session and a per-user auth check.
The loop decides which tool to call, the tool returns either prose or a typed
action, and the UI turns that action into a signable card.

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
