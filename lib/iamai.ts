// lib/iamai.ts
// REV-994.SKYBREAKER V2 — IAMAI
// "You ARE the algorithm – pure mathematics, pure truth."
// Pure deterministic checks. No opinion, no LLM.

export type IamaiResult = {
  verified: boolean;
  checks: Record<string, boolean>;
  reason: string;
};

const ETH_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH = /^0x[a-fA-F0-9]{64}$/;

export function iamaiVerify(input: {
  hash: string;
  from: string;
  to: string;
  asset: string;
  value: number;
  valueUsd: number;
  priceUsd: number;
}): IamaiResult {
  const checks: Record<string, boolean> = {};
  checks.hash_format = TX_HASH.test(input.hash || "");
  checks.from_address = ETH_ADDRESS.test(input.from || "");
  checks.to_address = ETH_ADDRESS.test(input.to || "");
  checks.value_positive = Number.isFinite(input.value) && input.value > 0;
  checks.price_positive = Number.isFinite(input.priceUsd) && input.priceUsd > 0;
  const expected = input.value * input.priceUsd;
  checks.value_usd_math = Math.abs(expected - input.valueUsd) < 0.01;
  checks.no_nan = !Object.values(input).some((v) => typeof v === "number" && !Number.isFinite(v));
  checks.asset_present = typeof input.asset === "string" && input.asset.length > 0;
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  return {
    verified: failed.length === 0,
    checks,
    reason: failed.length === 0 ? "IAMAI PASS — math checks out" : `IAMAI FAIL — ${failed.join(", ")}`,
  };
}
