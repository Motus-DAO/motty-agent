import { createPublicClient, http, keccak256, parseAbi, toHex, type Address, type Hex, type PublicClient } from "viem";
import { celo } from "viem/chains";
import {
  CELO_RPC,
  THERAPY_ESCROW_ADDRESS,
  WMXN_ADDRESS,
} from "./constants.js";

export const THERAPY_ESCROW_ABI = parseAbi([
  "event SessionCreated(bytes32 indexed id, address indexed patient, address indexed payee, address token, uint256 amount, uint64 startsAt, uint32 challengeWindow)",
  "event Deposited(bytes32 indexed id, uint256 amount)",
  "event Settled(bytes32 indexed id, uint64 settledAt)",
  "event Released(bytes32 indexed id, uint256 payeeAmount, uint256 fee)",
  "function sessions(bytes32 id) view returns (address token, address patient, address payee, uint256 amount, uint64 startsAt, uint64 settledAt, uint32 challengeWindow, uint8 status)",
  "function createSession(bytes32 id, address token, address patient, address payee, uint256 amount, uint64 startsAt, uint32 challengeWindow)",
  "function deposit(bytes32 id)",
  "function settle(bytes32 id)",
  "function release(bytes32 id)",
  "function cancelBeforeStart(bytes32 id)",
  "function refundStale(bytes32 id)",
  "function dispute(bytes32 id)",
  "function operator() view returns (address)",
  "function oracle() view returns (address)",
  "function treasury() view returns (address)",
  "function feeBps() view returns (uint16)",
]);

export const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
]);

export const ESCROW_STATUS = [
  "None",
  "Created",
  "Funded",
  "Settled",
  "Disputed",
  "Released",
  "Refunded",
] as const;

export type EscrowStatus = (typeof ESCROW_STATUS)[number];

export type EscrowSnapshot = {
  id: Hex;
  token: Address;
  patient: Address;
  payee: Address;
  amount: bigint;
  startsAt: number;
  settledAt: number;
  challengeWindow: number;
  status: number;
  statusLabel: EscrowStatus;
};

export function escrowClient(): PublicClient {
  return createPublicClient({ chain: celo, transport: http(CELO_RPC) }) as PublicClient;
}

/** Deterministic id: keccak256("therapy:" + sessionId). */
export function therapyEscrowId(sessionId: string): Hex {
  return keccak256(toHex(`therapy:${sessionId}`));
}

export async function readEscrow(id: Hex): Promise<EscrowSnapshot | null> {
  const raw = (await escrowClient().readContract({
    address: THERAPY_ESCROW_ADDRESS,
    abi: THERAPY_ESCROW_ABI,
    functionName: "sessions",
    args: [id],
  })) as readonly [Address, Address, Address, bigint, bigint, bigint, number, number];

  if (raw[0] === "0x0000000000000000000000000000000000000000") return null;
  const status = Number(raw[7]);
  return {
    id,
    token: raw[0],
    patient: raw[1],
    payee: raw[2],
    amount: raw[3],
    startsAt: Number(raw[4]),
    settledAt: Number(raw[5]),
    challengeWindow: Number(raw[6]),
    status,
    statusLabel: ESCROW_STATUS[status] ?? "None",
  };
}

export async function readEscrowBySessionId(
  sessionId: string,
): Promise<EscrowSnapshot | null> {
  return readEscrow(therapyEscrowId(sessionId));
}

/** 90/10 split helpers for UI/receipts. */
export function splitEscrow(amount: bigint, feeBps = 1000): { payee: bigint; fee: bigint } {
  const fee = (amount * BigInt(feeBps)) / 10000n;
  return { payee: amount - fee, fee };
}

export function wmxnBalanceOf(address: Address) {
  return escrowClient().readContract({
    address: WMXN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
  });
}
