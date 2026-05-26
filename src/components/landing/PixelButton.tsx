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

export default function PixelButton({ children, onClick, variant = "primary", size = "md", className = "", disabled = false, href }: PixelButtonProps) {
  const sizes: Record<string, { padding: string; fontSize: string }> = {
    sm: { padding: "8px 16px", fontSize: "0.7rem" },
    md: { padding: "12px 24px", fontSize: "0.82rem" },
    lg: { padding: "16px 32px", fontSize: "0.95rem" },
    xl: { padding: "20px 40px", fontSize: "1.05rem" },
  };
  const variants: Record<string, { bg: string; color: string; hoverBg: string }> = {
    primary: { bg: "var(--green)", color: "#0a1a0e", hoverBg: "#5cd895" },
    secondary: { bg: "var(--blue)", color: "#fff", hoverBg: "#7cb0ff" },
    gold: { bg: "var(--gold)", color: "#1a1800", hoverBg: "#fde066" },
    danger: { bg: "var(--red)", color: "#fff", hoverBg: "#ff7a7a" },
  };
  const v = variants[variant];
  const s = sizes[size];
  const Component = href ? motion.a : motion.button;
  return (
    <Component
      href={href} onClick={onClick} disabled={disabled}
      className={className}
      style={{
        ...s, background: v.bg, color: v.color, border: "none",
        borderRadius: "var(--radius)", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, display: "inline-flex", alignItems: "center",
        justifyContent: "center", gap: "8px", fontWeight: 700,
        fontFamily: "var(--font)", transition: "0.2s",
      }}
      whileHover={!disabled ? { scale: 1.03, background: v.hoverBg } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
    >
      {children}
    </Component>
  );
}
