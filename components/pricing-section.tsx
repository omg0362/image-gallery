"use client";

import { motion } from "framer-motion";
import { Check, Circle, Coins } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

type CreditPack = "pro" | "ultra";

const PENDING_CREDIT_PACK_KEY = "music:pending-credit-pack";

type PricingPlan = {
  credits: string;
  cta: string;
  description: string;
  id: CreditPack;
  name: string;
  price: string;
  points: string[];
};

const plans: PricingPlan[] = [
  {
    credits: "100",
    cta: "Start with Pro",
    description: "가볍게 시작해서 쇼츠, 브이로그, 광고 테스트 음악을 빠르게 만들어보세요.",
    id: "pro",
    name: "Pro",
    price: "$5",
    points: ["100 credits included", "1분 기본 생성 100회 기준", "필요할 때만 충전"],
  },
  {
    credits: "1,100",
    cta: "Start with Ultra",
    description: "더 많은 결과물을 만들고 여러 길이와 버전을 비교해야 하는 제작자를 위한 선택입니다.",
    id: "ultra",
    name: "Ultra",
    price: "$50",
    points: ["1,100 credits included", "Pro 대비 10% bonus", "긴 영상과 다중 결과물에 적합"],
  },
];

export function PricingSection() {
  const { session } = useAuth();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutPack, setCheckoutPack] = useState<CreditPack | null>(null);

  async function handleCheckout(pack: CreditPack) {
    setCheckoutError(null);

    if (!session?.access_token) {
      window.localStorage.setItem(PENDING_CREDIT_PACK_KEY, pack);
      window.location.assign("/auth");
      return;
    }

    setCheckoutPack(pack);

    try {
      const response = await fetch("/api/checkout/credits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pack }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: unknown; url?: unknown }
        | null;

      if (!response.ok || typeof data?.url !== "string") {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Failed to open checkout.",
        );
      }

      window.location.assign(data.url);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Failed to open checkout. Please try again.",
      );
      setCheckoutPack(null);
    }
  }

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[#030303] px-4 py-24 text-white sm:px-6 lg:py-32"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(254,205,0,0.12),transparent_32%),radial-gradient(circle_at_14%_84%,rgba(255,255,255,0.055),transparent_24%),radial-gradient(circle_at_86%_72%,rgba(254,205,0,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FECD00]/28 to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1"
          >
            <Circle
              className="h-2 w-2"
              fill="#FECD00"
              stroke="#FECD00"
              aria-hidden="true"
            />
            <span className="text-sm tracking-wide text-white/60">
              Pricing
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-4xl font-semibold tracking-tight text-white sm:text-6xl"
          >
            필요한 만큼만
            <br />
            <span className="bg-gradient-to-r from-[#FECD00] via-white to-[#FECD00] bg-clip-text text-transparent">
              크레딧으로 결제하세요
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.16, ease: [0.25, 0.4, 0.25, 1] }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/44 sm:text-base"
          >
            구독 없이 크레딧을 충전하고, 생성할 때만 사용합니다. 1분 1개
            결과물은 기본 1 credit, 길이와 결과물 수에 따라 비용이 명확하게
            늘어납니다.
          </motion.p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                delay: 0.12 * index,
                duration: 0.72,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="relative min-h-[360px] overflow-hidden rounded-[8px] border border-white/12 bg-white p-6 text-[#171717] shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
            >
              <div
                className="absolute inset-0 z-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 18%, #FFF991 0%, transparent 64%)",
                  mixBlendMode: "multiply",
                  opacity: index === 0 ? 0.58 : 0.76,
                }}
              />
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-black/70">
                      {plan.name}
                    </h3>
                    <p className="mt-3 text-4xl font-semibold text-black">
                      {plan.price}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-black/[0.04] text-black">
                    <Coins className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>

                <p className="text-sm leading-6 text-black/58">
                  {plan.description}
                </p>

                <div className="mt-7 rounded-[8px] border border-black/10 bg-black/[0.035] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/42">
                    Credits
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-black">
                    {plan.credits}
                  </p>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-black/62">
                  {plan.points.map((point) => (
                    <li key={point} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-black" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={checkoutPack !== null}
                  onClick={() => {
                    void handleCheckout(plan.id);
                  }}
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-full bg-black px-4 text-sm font-semibold text-white transition hover:bg-black/82"
                >
                  {checkoutPack === plan.id ? "Opening checkout..." : plan.cta}
                </button>
              </div>
            </motion.article>
          ))}
        </div>

        {checkoutError ? (
          <p className="mx-auto mt-6 max-w-md rounded-[8px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-100">
            {checkoutError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
