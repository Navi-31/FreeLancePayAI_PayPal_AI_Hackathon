import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08080D] text-[#e4e1ea] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#101016] border border-[#f4c86d]/30 flex items-center justify-center mb-6 shadow-lg shadow-[#f4c86d]/10">
        <span className="font-mono text-xl font-black text-[#f4c86d]">404</span>
      </div>
      <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Ledger Route Not Found</h1>
      <p className="text-sm text-[#9a8f7e] max-w-md mb-8">
        The financial telemetry node you requested does not exist or has been relocated to another enclave.
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg bg-[#1b1b21] hover:bg-[#252430] border border-white/10 text-white text-xs font-semibold transition-all"
        >
          Landing Page
        </Link>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#F0D48B] to-[#D6AD55] text-[#08080D] text-xs font-bold shadow-lg shadow-[#f4c86d]/20 transition-all hover:brightness-110"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
