# Motty Pay — on-chain proof (Celo mainnet)

This is the real money trail behind the SDK. Every amount below is on **Celo
mainnet (42220)** and is verifiable on Celoscan.

## Rails

| Piece | Address / value |
| --- | --- |
| wMXN (Ripio) | `0x337E7456B420bD3481e7FA61fA9850343d610d34` |
| USDT (Celo) | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` |
| TherapyEscrow | `0xFd9F38AD6143B018e60F86B5304C53223FBf2dBC` |
| Escrow deploy block | `82227556` |
| DAO treasury | `0xf229F3Dcea3D7cd3cA5ca41C4C50135D7b37F2b9` |
| Settlement agent | `0xb3C5EA7E583FBa073006c6C553239daC59e3d47B` |
| ERC-8004 agentId | `10053` |
| ERC-8021 attribution | `celo_0ee3486819c5` |

## E2E #1 — 1 wMXN therapy session

- Escrow id: `0x3f92c51291a5a31b5edec0692f41b7e54f561605c6357bdb6ddd0b82a448d4cd`
- Patient: `0xD7dcF535f4159C18E252fF759bA2B14A1e91a2e0`
- Professional: `0xd0563BBa8E42b6ab0ECDfc1f0eA1486c5C28Ba3b`
- Amount: **1.000000000000000000 wMXN**
- Starts at: `1794129913` (Unix)
- Challenge window: `0`

| Step | Tx | Block |
| --- | --- | --- |
| `createSession` | `0x742fc9f206c2df76a842e2cc8cce66861b43fb8473d6090259e7421fb5d04495` | 82228557 |
| `deposit` | `0x4afe8bfc10e32567d1ef319864625aeb6f8340f78baf0c970eda4d9a845c28cd` | 82229730 |
| `settle` | `0x1395ee7c0243d88e8e8e3f8c80a255e4bd656bd59f6610a8000536a74d56cb07` | 82229919 |
| `release` | `0x58dc83f65a2de9ec9672377f88c1c20682cb33046a5ed8aa7b53c0cb64422853` | 82230063 |

Release split: **0.900000000000000000 wMXN** to the professional and
**0.100000000000000000 wMXN** to the treasury (10%). The escrow ends
`Released`.

## E2E #2 — 10 wMXN therapy session

- Escrow id: `0xa43437802d1594d9661ab01d36be0ccf7c3a2eca08bde5ac8949ebe1d2b5c05d`
- Amount: **10 wMXN**; patient `0xD7dc…`; professional `0xd056…`
- Starts at: `1794177664`; challenge window `0`

| Step | Tx | Block |
| --- | --- | --- |
| `createSession` | `0x58d93ff488e2faa8c4532123ae8f673f8f1b61aba31db463677496dc08b6aec4` | 82276848 |
| `deposit` | `0x69b8435beaf7ef828ccc2b757345598e86fb260e3b587ebf6c35cd0132a24063` | 82277798 |
| `settle` | `0x962546de57a5285f11450ca9accd05fcc1952113d34a229c81e7dd63a59f52df` | 82278171 |
| `release` | `0xc158a1d6283448efde101028a067b91aebf91955883f5292ac8c585efe74fc0b` | 82278287 |

Release split: **9.0 wMXN** to the professional and **1.0 wMXN** to treasury.

## Other sessions on the same contract

- 10 wMXN: escrow `0xe9ef01c1a2c3cbb5cc8d2f8a377b69748fb12a24080238ea25f8e2760fee223f`
  · create `0xbfa4766d91367425e31699d3b26412cb40a4065c6dccaa22b964b94eaea6bdb2`
  · deposit `0x9ba3630cb647496577514663373d72e6584864bb30e572af0949ce31e0742ca1`
- 10 wMXN: escrow `0x01f13523370c36255213b8a912e6cca6951967f1b0922ff3297067a78d401ce0`
  · create `0x59c7c2e79fab9a5a37ba949a49e4939c1f4227b46eebd6c7a0cbe3e07dd3d7bc`
  · deposit `0xcaa11d639fefe779773ca6d2ce4e7f229c5f1c9f46f114f32c4a6544727a373b`
- 832.5 wMXN (45 USD quote at 18.5): escrow `0x129ef4591a9a92ff25ba40b77c5ea7e4012cd6219623b1d06d1c8a0602dd69c9`
  · create `0x4c0980cf71213546406f73344fc6ea7c132ac1b954877f018e37c5f85cc5e8b2`

## Contract

- Source: [`contracts/TherapyEscrow.sol`](../contracts/TherapyEscrow.sol)
- Deploy: `0xe8bdf10af4da4d8a4d096e85943841d511572bc1942ab4c5159a9f23c5d8d5b6`
- Ownership transfer (agent → cold owner):
  `0x7b33c1053fb4a61247cde4f8eff1c7c1f045b5f249232da8468ebe6a8b4e332e`
- ABIs and read helpers: [`src/chain/escrow.ts`](../src/chain/escrow.ts)
- Escrow id is deterministic: `keccak256("therapy:" + sessionId)`.

## ERC-8004 / ERC-8021

- Agent identity: **10053**; registration tx
  `0x2d01e5910bbccdb423d3c47c9b3fbbe44101a6ca167378343def72232cc713ac`.
- Metadata: `https://app.motusdao.org/agent.json`.
- Attribution code `celo_0ee3486819c5` is appended to the Hub's Celo
  transactions. The first tagged 1 wMXN WaaP tx is
  `0x9d0ad535…74a22` (prefix/suffix; full hash in Celoscan).
- `attributionSuffix()` in [`src/chain/attribution.ts`](../src/chain/attribution.ts)
  returns the ERC-8021 data suffix for host transactions.

## Ripio ramp

- 50 wMXN bought from the Ripio on-ramp on iPhone; tx
  `0xf02132ff9a51…b379e2` (prefix/suffix; full hash in Celoscan).
- The SDK exposes `getRipioRampLink` through the payments adapter.

## Verify locally

```ts
import { readEscrow, splitEscrow } from "@motusdao/motty";

const escrow = await readEscrow(
  "0x3f92c51291a5a31b5edec0692f41b7e54f561605c6357bdb6ddd0b82a448d4cd",
);
// status: 5 (Released), amount: 1e18n
const split = splitEscrow(1_000_000_000_000_000_000n);
// { payee: 900000000000000000n, fee: 100000000000000000n }
```
