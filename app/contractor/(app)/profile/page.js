"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The profile + work-performance view has been consolidated into the main
// contractor hub at /contractor/dashboard. This route now just forwards there
// so any existing links or bookmarks keep working.
export default function ContractorProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/contractor/dashboard");
  }, [router]);
  return null;
}
