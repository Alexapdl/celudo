"use client";

import { motion } from "framer-motion";

interface PixelButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "gold" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  disabled?: boolean;
  href?: string;
}

export default function PixelButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  href,
}: PixelButtonProps) {
  const sizeStyles = {
    sm: { padding: "8px 16px", fontSize: "0.7rem" },
    md: { padding: "12px 24px", fontSize: "0.82rem" },
    lg: { padding: "16px 32px", fontSize: "0.95rem" },
    xl: { padding: "20px 44px", fontSize: "1.1rem" },
  };

  const variantStyles = {
    primary: {
      background: "linear-gradient(180deg, #60e040, #40c020)",
      color: "#ffffff",
      borderColor: "#1b6e22",
      boxShadow: "0 5px 0 #1b6e22, 0 7px 14px rgba(0,0,0,0.12)",
      hoverShadow: "0 7px 0 #1b6e22, 0 10px 18px rgba(0,0,0,0.18)",
    },
    secondary: {
      background: "linear-gradient(180deg, #20a0ff, #0040a0)",
      color: "#ffffff",
      borderColor: "#003080",
      boxShadow: "0 5px 0 #003080, 0 7px 14px rgba(0,0,0,0.12)",
      hoverShadow: "0 7px 0 #003080, 0 10px 18px rgba(0,0,0,0.18)",
    },
    gold: {
      background: "linear-gradient(180deg, #ffe060, #ffc020)",
      color: "#3a2000",
      borderColor: "#a06000",
      boxShadow: "0 5px 0 #a06000, 0 7px 16px rgba(249,168,37,0.25)",
      hoverShadow: "0 7px 0 #a06000, 0 10px 20px rgba(249,168,37,0.35)",
    },
    danger: {
      background: "linear-gradient(180deg, #e08040, #c06020)",
      color: "#ffffff",
      borderColor: "#803010",
      boxShadow: "0 5px 0 #803010, 0 7px 14px rgba(229,37,33,0.2)",
      hoverShadow: "0 7px 0 #803010, 0 10px 18px rgba(229,37,33,0.3)",
    },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      href={href}
      onClick={onClick}
      disabled={disabled}
      className={`pixel-btn ${className}`}
      style={{
        ...s,
        background: v.background,
        color: v.color,
        boxShadow: v.boxShadow,
        fontFamily: "var(--pixel)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
        border: `3px solid ${v.borderColor}`,
        borderRadius: "var(--r, 4px)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontWeight: 800,
        position: "relative" as const,
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      whileHover={!disabled ? { y: -3, boxShadow: v.hoverShadow } : {}}
      whileTap={!disabled ? { y: 2, boxShadow: "0 1px 0 rgba(0,0,0,0.3)" } : {}}
    >
      {children}
    </Component>
  );
}
