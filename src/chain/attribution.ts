import { toDataSuffix } from "@celo/attribution-tags";
import { CELO_ATTRIBUTION_CODE } from "./constants.js";

/** ERC-8021 data suffix for Celo transactions. */
export function attributionSuffix(code = CELO_ATTRIBUTION_CODE): `0x${string}` {
  return toDataSuffix(code);
}

/** True when a tx calldata/suffix contains the hackathon attribution code. */
export function hasAttribution(data: string, code = CELO_ATTRIBUTION_CODE): boolean {
  return data.toLowerCase().includes(
    Buffer.from(code, "utf8").toString("hex").toLowerCase(),
  );
}
