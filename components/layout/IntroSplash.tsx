"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "lngc:intro-seen:v1";
const VISIBILITY_ID = "lngc-intro-visibility";
const HOLD_MS = 4500;
const TOTAL_MS = 5000;
let seenInDocument = false;

// Start at first HTML paint, rather than after hydration. CSSOM leaves the hydration DOM unchanged.
const sessionCheck = `{
  const sheet=document.getElementById("${VISIBILITY_ID}").sheet;
  let seen=false;
  try{seen=sessionStorage.getItem("${SESSION_KEY}")==="1"}catch{}
  if(window.__lngcIntroStartedAt===undefined){
    if(seen){sheet.insertRule(".intro-splash{display:none!important}")}
    else{
      window.__lngcIntroStartedAt=performance.now();
      try{sessionStorage.setItem("${SESSION_KEY}","1")}catch{}
      setTimeout(()=>{sheet.insertRule(".intro-splash{opacity:0!important;pointer-events:none!important}")},${HOLD_MS});
      setTimeout(()=>{sheet.insertRule(".intro-splash{display:none!important}")},${TOTAL_MS});
    }
  }
}`;

export default function IntroSplash() {
  const [phase, setPhase] = useState<"visible" | "fading" | "done">("visible");
  const shouldPlay = useRef<boolean | null>(null);

  useEffect(() => {
    // Preserve the initial decision across Strict Mode effect replay.
    if (shouldPlay.current === null) {
      let seen = seenInDocument;
      try { seen ||= sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* Storage may be unavailable. */ }
      const startedAt = (window as Window & { __lngcIntroStartedAt?: number }).__lngcIntroStartedAt;
      shouldPlay.current = startedAt !== undefined || !seen;
    }
    if (!shouldPlay.current) {
      setPhase("done");
      return;
    }
    seenInDocument = true;
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* Keep the in-document fallback. */ }
    const startedAt = (window as Window & { __lngcIntroStartedAt?: number }).__lngcIntroStartedAt;
    const elapsed = startedAt === undefined ? 0 : performance.now() - startedAt;
    const fadeTimer = elapsed < TOTAL_MS
      ? window.setTimeout(() => setPhase("fading"), Math.max(0, HOLD_MS - elapsed))
      : undefined;
    const removeTimer = window.setTimeout(() => setPhase("done"), Math.max(0, TOTAL_MS - elapsed));
    return () => {
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      <style id={VISIBILITY_ID}>{"/* Session-specific intro visibility. */"}</style>
      <script dangerouslySetInnerHTML={{ __html: sessionCheck }} />
      {phase !== "done" && <section id="lngc-intro-splash" className="intro-splash" data-phase={phase} role="status" aria-live="polite" aria-atomic="true">
        <div className="intro-splash__background" aria-hidden="true">
          <Image src="/images/overview-vessel-wide.png" alt="" fill sizes="100vw" preload unoptimized className="intro-splash__image" />
        </div>
        <div className="intro-splash__content">
          <p className="intro-splash__eyebrow">PRODUCTION CONTROL / 01</p>
          <p className="intro-splash__title">LNGC Production Digital Twin</p>
          <p className="intro-splash__message">Loading workspace...</p>
          <div className="intro-splash__dots" aria-hidden="true"><span /><span /><span /></div>
        </div>
      </section>}
      <noscript><style>{".intro-splash{display:none!important}"}</style></noscript>
    </>
  );
}
