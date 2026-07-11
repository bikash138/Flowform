"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  const [isRetrying, setIsRetrying] = useState(false);

  // A full reload re-runs the proxy against the original URL, so a recovered
  // API drops the user straight back where they were headed.
  const handleRetry = () => {
    setIsRetrying(true);
    window.location.reload();
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={isRetrying}
      className="h-11 w-full gap-2 rounded-lg font-semibold"
    >
      <RotateCw className={`size-4 ${isRetrying ? "animate-spin" : ""}`} />
      {isRetrying ? "Retrying…" : "Try again"}
    </Button>
  );
}
