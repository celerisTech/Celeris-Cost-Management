"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EscNavigationHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        // Prevent default browser behavior if needed, and navigate back
        router.back();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  return null;
}
