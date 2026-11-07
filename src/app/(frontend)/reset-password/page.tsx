import React, { Suspense } from "react";
import { ResetPasswordClient } from "@/frontend/features/auth/ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08080D] flex items-center justify-center text-white font-mono text-sm">
          Loading security gateway...
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
