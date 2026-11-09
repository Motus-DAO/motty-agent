/** Celo mainnet rails used by Motty Pay. */
export const CELO_CHAIN_ID = 42220;

export const WMXN_ADDRESS =
  "0x337E7456B420bD3481e7FA61fA9850343d610d34" as const;
export const USDT_ADDRESS =
  "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as const;
export const CELO_NATIVE = "CELO" as const;

export const THERAPY_ESCROW_ADDRESS =
  "0xFd9F38AD6143B018e60F86B5304C53223FBf2dBC" as const;
export const THERAPY_ESCROW_DEPLOY_BLOCK = 82227556n;

export const DAO_TREASURY_ADDRESS =
  "0xf229F3Dcea3D7cd3cA5ca41C4C50135D7b37F2b9" as const;
export const SETTLEMENT_AGENT_ADDRESS =
  "0xb3C5EA7E583FBa073006c6C553239daC59e3d47B" as const;
export const ERC8004_AGENT_ID = 10053;

/** ERC-8021 attribution code used by the hackathon transactions. */
export const CELO_ATTRIBUTION_CODE = "celo_0ee3486819c5";

export const CELO_EXPLORER = "https://celoscan.io";
export const CELO_RPC = "https://forno.celo.org";

export function celoTxUrl(hash: string): string {
  return `${CELO_EXPLORER}/tx/${hash}`;
}

export function celoAddressUrl(address: string): string {
  return `${CELO_EXPLORER}/address/${address}`;
}
