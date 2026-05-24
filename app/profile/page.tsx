"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Profile lives on Home — keep old URL working. */
export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard#profile");
  }, [router]);

  return null;
}
