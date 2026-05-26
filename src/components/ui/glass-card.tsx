"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export function GlassCard({ children, className, delay = 0, hover = true }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-white/[0.03] backdrop-blur-xl",
        "border border-white/[0.08]",
        "shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]",
        "after:absolute after:inset-0 after:rounded-2xl after:pointer-events-none",
        "after:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_70%)]",
        "transition-all duration-300",
        hover && "hover:border-white/[0.15] hover:shadow-[0_16px_48px_0_rgba(69,209,133,0.08)]",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

interface GlassCardTopProps {
  color?: "green" | "gold" | "blue" | "purple" | "red";
}

export function GlassCardTop({ color = "green" }: GlassCardTopProps) {
  const colors = {
    green: "from-green-500/40 via-green-500/10 to-transparent",
    gold: "from-amber-300/40 via-amber-300/10 to-transparent",
    blue: "from-sky-400/40 via-sky-400/10 to-transparent",
    purple: "from-purple-500/40 via-purple-500/10 to-transparent",
    red: "from-red-400/40 via-red-400/10 to-transparent",
  };
  return <div className={cn("absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r", colors[color])} />;
}
