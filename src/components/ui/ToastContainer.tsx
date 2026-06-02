"use client";

interface Toast { id: string; msg: string; type: "success" | "error" | "info"; }

export default function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type === "success" ? "toast-success" : t.type === "error" ? "toast-error" : "toast-info"}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
