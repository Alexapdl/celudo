"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Toast {
  id: string;
  msg: string;
  type: "success" | "error" | "info";
}

interface ToastContainerProps {
  toasts: Toast[];
}

export default function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`toast toast-${toast.type}`}
          >
            {toast.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
