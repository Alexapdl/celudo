"use client";

import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

function ElegantShape({
  className, delay = 0, width = 400, height = 100,
  rotate = 0, gradient = "from-green-500/[0.15]",
}: {
  className?: string; delay?: number; width?: number;
  height?: number; rotate?: number; gradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ duration: 2.4, delay, ease: [0.23, 0.86, 0.39, 0.96] as const, opacity: { duration: 1.2 } }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ width, height }}
        className="relative"
      >
        <div className={cn(
          "absolute inset-0 rounded-full",
          "bg-gradient-to-r to-transparent", gradient,
          "backdrop-blur-[2px] border-2 border-white/[0.08]",
          "shadow-[0_8px_32px_0_rgba(69,209,133,0.08)]",
          "after:absolute after:inset-0 after:rounded-full",
          "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]"
        )} />
      </motion.div>
    </motion.div>
  );
}

export function HeroGeometric({
  badge = "Live on Celo",
  title1 = "Play Ludo",
  title2 = "Boost Your Yield",
  subtitle = "The first Play-to-Boost platform on Celo. Stake tokens, play Ludo, and rocket your APY up to +5%.",
}: {
  badge?: string; title1?: string; title2?: string; subtitle?: string;
}) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 1, delay: 0.5 + i * 0.2, ease: [0.25, 0.4, 0.25, 1] as const },
    }),
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden" style={{ background: "#12121e" }}>
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.04] via-transparent to-amber-300/[0.04] blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape delay={0.3} width={700} height={160} rotate={12}
          gradient="from-green-500/[0.1]" className="left-[-8%] md:left-[-3%] top-[12%] md:top-[18%]" />
        <ElegantShape delay={0.5} width={550} height={130} rotate={-15}
          gradient="from-amber-300/[0.1]" className="right-[-5%] md:right-[0%] top-[68%] md:top-[72%]" />
        <ElegantShape delay={0.4} width={350} height={90} rotate={-8}
          gradient="from-sky-400/[0.1]" className="left-[5%] md:left-[8%] bottom-[8%] md:bottom-[12%]" />
        <ElegantShape delay={0.6} width={240} height={70} rotate={20}
          gradient="from-green-400/[0.1]" className="right-[12%] md:right-[18%] top-[8%] md:top-[12%]" />
        <ElegantShape delay={0.7} width={180} height={50} rotate={-25}
          gradient="from-purple-500/[0.1]" className="left-[18%] md:left-[22%] top-[3%] md:top-[8%]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 md:px-8" style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div custom={0} variants={fadeUpVariants} initial="hidden" animate="visible"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-10 md:mb-14">
            <Circle className="h-2.5 w-2.5 fill-green-500/80" />
            <span className="text-sm text-white/55 tracking-wide">{badge}</span>
          </motion.div>

          <motion.div custom={1} variants={fadeUpVariants} initial="hidden" animate="visible">
            <h1 className="text-5xl sm:text-7xl md:text-[5.5rem] font-extrabold mb-8 md:mb-10 tracking-tight leading-[1.05]">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/75">{title1}</span>
              <br />
              <span className={cn("bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-white/90 to-amber-300")}>{title2}</span>
            </h1>
          </motion.div>

          <motion.div custom={2} variants={fadeUpVariants} initial="hidden" animate="visible">
            <p className="text-base sm:text-lg md:text-xl text-white/35 mb-10 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
              {subtitle}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#12121e] via-transparent to-[#12121e]/80 pointer-events-none" />
    </div>
  );
}
