import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#12121e]">
      <div className="text-center px-4">
        <div className="text-6xl mb-6">🎲</div>
        <h1 className="text-2xl font-bold text-[#f0f0f5] mb-3">Page Not Found</h1>
        <p className="text-[#8888a0] mb-8 max-w-md mx-auto">
          Looks like you rolled a 404. This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#45d185] text-[#0a1a0e] font-bold hover:brightness-110 transition-all"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
