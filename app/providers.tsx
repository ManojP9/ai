"use client";

import { SessionProvider } from "next-auth/react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false,
      });
    }
  }, []);

  return (
    <SessionProvider>
      <PostHogProvider client={posthog}>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 2500,
            style: {
              background: "#1a1a2e",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              fontSize: "14px",
              fontWeight: 500,
            },
          }}
        />
      </PostHogProvider>
    </SessionProvider>
  );
}
