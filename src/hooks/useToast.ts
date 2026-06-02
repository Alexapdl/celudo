"use client";

import { useState, useCallback } from "react";
import { soundManager } from "@/lib/sound";

export interface Toast {
  id: string;
  msg: string;
  type: "success" | "error" | "info";
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, msg, type }]);
    soundManager.toastSound(type);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, showToast };
}
