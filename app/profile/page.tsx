"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Profile page — keep old URL working. */
export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
