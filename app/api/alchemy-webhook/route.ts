import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { iamaiVerify } from "@/lib/iamai";

function isValidSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", process.env.ALCHEMY_SIGNING_KEY!).update(rawBody).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature)); }
  catch { return false; }
}

async function getPriceUsd(asset: string): Promise<number> {
  if (asset === "ETH") return 3400;
  if (asset === "USDC" || asset === "USDT") return 1;
  return 0;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-alchemy-signature");
  if (!isValidSignature(rawBody, sig)) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }
  const payload = JSON.parse(rawBody);
  const activity = payload?.event?.activity?.[0];
  if (!activity) return NextResponse.json({ status: "ok" }, { status: 200 });
  const response = NextResponse.json({ status: "ok" }, { status: 200 });
  const waitUntil = (req as any).waitUntil || ((p: Promise<any>) => p.catch(()=>{}));
  waitUntil((async () => {
    try {
      const value = Number(activity.value);
      const asset = activity.asset || "UNKNOWN";
      const priceUsd = await getPriceUsd(asset);
      const valueUsd = value * priceUsd;
      const iamai = iamaiVerify({ hash: activity.hash, from: activity.from, to: activity.to, asset, value, valueUsd, priceUsd });
      console.log("[IAMAI]", iamai.reason, iamai.checks);
      if (!iamai.verified) {
        console.log("[IAMAI-BLOCKED] Not writing to Supabase:", activity.hash, iamai.reason);
        return;
      }
      console.log("[deepseek-summary] IAMAI verified, ready for DeepSeek + Supabase write:", activity.hash);
    } catch (e) { console.error("[webhook-error]", e); }
  })());
  return response;
}
