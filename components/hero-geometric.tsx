"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "border-2 border-white/[0.15] backdrop-blur-[2px]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]",
          )}
        />
      </motion.div>
    </motion.div>
  );
}

function HeroGeometric({
  badge = "Design Collective",
  title1 = "Elevate Your Digital Vision",
  title2 = "Crafting Exceptional Websites",
  description = "Crafting exceptional digital experiences through innovative design and cutting-edge technology.",
  titleClassName,
}: {
  badge?: string;
  description?: string;
  title1?: string;
  title2?: string;
  titleClassName?: string;
}) {
  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  };

  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#030303] px-4 pb-14 pt-24 text-white sm:px-6 sm:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(254,205,0,0.12),transparent_28%),linear-gradient(135deg,rgba(99,102,241,0.06),transparent_42%,rgba(244,63,94,0.06))] blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-86%] top-[18%] scale-75 opacity-45 sm:left-[-22%] sm:scale-100 md:left-[-5%] md:top-[20%] md:opacity-100"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.15]"
          className="right-[-92%] top-[76%] scale-75 opacity-45 sm:right-[-24%] sm:scale-100 md:right-[0%] md:top-[75%] md:opacity-100"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.15]"
          className="bottom-[8%] left-[-44%] scale-75 opacity-35 sm:left-[2%] sm:scale-100 md:bottom-[10%] md:left-[10%] md:opacity-100"
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.15]"
          className="right-[-26%] top-[11%] scale-75 opacity-55 sm:right-[10%] sm:scale-100 md:right-[20%] md:top-[15%] md:opacity-100"
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-cyan-500/[0.15]"
          className="left-[4%] top-[8%] scale-75 opacity-40 sm:left-[18%] sm:scale-100 md:left-[25%] md:top-[10%] md:opacity-100"
        />
      </div>

      <div className="container relative z-10 mx-auto">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.24)] backdrop-blur sm:mb-8 md:mb-12"
          >
            <Circle className="h-2 w-2 fill-[#FECD00] text-[#FECD00]" />
            <span className="text-xs font-medium tracking-[0.22em] text-white/68 sm:text-sm sm:tracking-wide">
              {badge}
            </span>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1
              className={cn(
                "mx-auto mb-5 max-w-[11ch] text-[3.9rem] font-bold leading-[0.86] tracking-normal sm:max-w-none sm:text-6xl md:mb-8 md:text-8xl",
                titleClassName,
              )}
            >
              <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
                {title1}
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 bg-clip-text text-transparent">
                {title2}
              </span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="mx-auto mb-7 max-w-[20rem] text-base font-light leading-7 text-white/58 sm:mb-8 sm:max-w-xl sm:text-lg sm:leading-relaxed md:text-xl">
              {description}
            </p>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <a
              href="/auth"
              className="inline-flex h-12 w-full max-w-[18rem] items-center justify-center rounded-full bg-white px-6 text-sm font-semibold tracking-wide text-[#030303] shadow-[0_12px_40px_rgba(255,255,255,0.16)] transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#030303] sm:w-auto sm:min-w-36"
            >
              Start creating
            </a>
            <a
              href="#example"
              className="inline-flex h-12 w-full max-w-[18rem] items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] px-6 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-white/24 sm:w-auto"
            >
              Listen examples
            </a>
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80" />
    </section>
  );
}

export { HeroGeometric };
