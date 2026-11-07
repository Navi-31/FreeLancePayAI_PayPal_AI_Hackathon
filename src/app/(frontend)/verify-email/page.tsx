import React, { Suspense } from "react";
import { VerifyOtpClient } from "@/frontend/features/auth/VerifyOtpClient";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08080D] flex items-center justify-center text-white font-mono text-sm">
          Loading verification gateway...
        </div>
      }
    >
      <VerifyOtpClient />
    </Suspense>
  );
}
