"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signup/account");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0]">
      <p className="text-sm text-[#8A7B6D]">Loading…</p>
    </div>
  );
}
