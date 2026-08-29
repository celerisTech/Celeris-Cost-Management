import React from "react";
import LoadingState from "@/app/components/LoadingState";

export default function RootLoading() {
  return (
    <LoadingState
      message="Loading Celeris Solutions"
      subtext="Setting up your financial workspace..."
      fullscreen={true}
    />
  );
}
