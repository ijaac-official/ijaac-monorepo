"use client";

import * as React from "react";

const KEY = "ijaac_visit_counted";

/** Counts one visit per browser session. Never throws, never blocks rendering. */
export default function VisitTracker() {
  React.useEffect(() => {
    try {
      if (window.sessionStorage.getItem(KEY)) return;
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      // storage blocked (private mode etc.) - the server-side cookie still dedupes
    }
    try {
      fetch("/api/visit", { method: "POST", keepalive: true, credentials: "same-origin" }).catch(
        () => undefined
      );
    } catch {
      // ignore
    }
  }, []);
  return null;
}
