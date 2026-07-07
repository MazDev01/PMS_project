"use client";

import { useEffect, useRef, useState } from "react";

// Wraps content that should hold its pre-animation state until it scrolls into
// view, then animate once. Charts inside gain `.reveal` / `.reveal.in-view`
// hooks that gate the chart entrance animations (see globals.css).
export default function Reveal({ children, className = "", style, threshold = 0.25 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // No IntersectionObserver (very old browser / SSR edge) → just show it.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect(); // animate a single time
          }
        });
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={`reveal${inView ? " in-view" : ""}${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}
