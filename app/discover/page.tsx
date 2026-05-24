"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DiscoverRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/mealdex");
  }, [router]);

  return null;
}
