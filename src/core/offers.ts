import { mottyConfig } from "./config.js";
import type { MottyAudience, MottyOffer } from "./types.js";

export function recommendOffer(audience: MottyAudience): MottyOffer {
  const offers = mottyConfig().offers;
  if (audience === "professionals") {
    return offers.find((o) => o.id === "academia") ?? offers[0]!;
  }
  if (audience === "community") {
    return offers.find((o) => o.id === "agents") ?? offers[0]!;
  }
  return offers.find((o) => o.id === "wellness-hub") ?? offers[0]!;
}

export function getOffer(id: string): MottyOffer | undefined {
  return mottyConfig().offers.find((offer) => offer.id === id);
}
