"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

const CYCLE_S = 16;

export function LandingCommunityGrowth() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setActive(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  const anim = active && !reducedMotion;
  const awaiting = !active && !reducedMotion;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden rounded-[2rem] border border-white/45 bg-gradient-to-br from-bark via-bark to-moss p-6 text-white shadow-panel dark:shadow-panel-dark sm:p-8 lg:p-10"
      aria-labelledby="landing-community-heading"
    >
      <div
        className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-marigold/15 blur-3xl motion-safe:animate-landing-drift"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-3xl motion-safe:animate-landing-float-slow"
        aria-hidden="true"
      />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
        <div className="max-w-sm lg:max-w-none">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Why community matters</p>
          <h2
            id="landing-community-heading"
            className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl"
          >
            One plant. Roots and branches.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Roots in your plan. Branches in your people.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-[11px] font-medium uppercase tracking-wider text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-300/90" aria-hidden="true" />
              You · Today
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-marigold" aria-hidden="true" />
              Community
            </span>
          </div>
        </div>

        <div
          className="relative mx-auto flex w-full max-w-md items-end justify-center lg:max-w-none"
          style={{ "--plant-cycle": `${CYCLE_S}s` } as CSSProperties}
        >
          <svg
            viewBox="0 0 360 300"
            className="h-auto w-full max-h-[280px] drop-shadow-lg"
            role="img"
            aria-label="Animated plant: roots grow from soil, stem rises, leaves and community nodes appear"
          >
            <defs>
              <linearGradient id="plant-soil" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
              </linearGradient>
              <linearGradient id="plant-stem" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#5a8f6e" />
                <stop offset="100%" stopColor="#8fbc9a" />
              </linearGradient>
              <linearGradient id="plant-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6b9080" />
                <stop offset="100%" stopColor="#a8c9b0" />
              </linearGradient>
            </defs>

            {/* Soil base */}
            <ellipse
              cx="180"
              cy="268"
              rx="120"
              ry="22"
              fill="url(#plant-soil)"
              className={twMerge(awaiting && "opacity-0", anim && "motion-safe:animate-landing-plant-soil")}
            />

            {/* Roots */}
            <g
              className={twMerge(awaiting && "opacity-0", anim && "motion-safe:animate-landing-plant-root")}
              style={{ transformOrigin: "180px 268px" }}
            >
              <path
                d="M180 248 Q150 268 120 272"
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M180 252 Q180 275 180 278"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M180 248 Q210 268 240 272"
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* Stem */}
            <path
              d="M180 248 Q178 180 182 95"
              fill="none"
              stroke="url(#plant-stem)"
              strokeWidth="5"
              strokeLinecap="round"
              className={twMerge(awaiting && "opacity-0", anim && "motion-safe:animate-landing-plant-stem")}
              style={{ transformOrigin: "180px 248px" }}
            />

            {/* Personal leaf (left) */}
            <g
              className={twMerge(awaiting && "opacity-0", anim && "motion-safe:animate-landing-plant-leaf-left")}
              style={{ transformOrigin: "140px 160px" }}
            >
              <path
                d="M182 165 Q130 150 115 175 Q130 195 165 178 Z"
                fill="url(#plant-leaf)"
                opacity="0.92"
              />
            </g>

            {/* Community branch */}
            <g
              className={twMerge(awaiting && "opacity-0", anim && "motion-safe:animate-landing-plant-branch")}
              style={{ transformOrigin: "200px 120px" }}
            >
              <path
                d="M182 130 Q220 110 255 95"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M255 95 Q275 88 290 100"
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* Crown leaf */}
            <g
              className={twMerge(awaiting && "opacity-0", anim && "motion-safe:animate-landing-plant-leaf-top")}
              style={{ transformOrigin: "182px 95px" }}
            >
              <path
                d="M182 95 Q165 55 182 40 Q199 55 182 95 Z"
                fill="url(#plant-leaf)"
                opacity="0.88"
              />
            </g>

            {/* Community nodes */}
            <g className={anim ? "motion-safe:animate-landing-plant-sway" : undefined} style={{ transformOrigin: "220px 100px" }}>
              <circle
                cx="255"
                cy="95"
                r="11"
                fill="#e8b84a"
                className={twMerge(awaiting && "opacity-0", anim && "motion-safe:animate-landing-plant-node")}
                style={{ transformOrigin: "255px 95px", animationDelay: anim ? "0.1s" : undefined }}
              />
              <circle
                cx="290"
                cy="100"
                r="9"
                fill="rgba(255,255,255,0.9)"
                className={twMerge(awaiting && "opacity-0", anim && "motion-safe:animate-landing-plant-node")}
                style={{ transformOrigin: "290px 100px", animationDelay: anim ? "0.35s" : undefined }}
              />
              <circle
                cx="228"
                cy="108"
                r="7"
                fill="rgba(255,255,255,0.75)"
                className={twMerge(awaiting && "opacity-0", anim && "motion-safe:animate-landing-plant-node")}
                style={{ transformOrigin: "228px 108px", animationDelay: anim ? "0.55s" : undefined }}
              />
            </g>

            {/* You node (base of growth) */}
            <circle
              cx="165"
              cy="178"
              r="8"
              fill="#a8d4b8"
              className={twMerge(awaiting && "opacity-0", anim && "motion-safe:animate-landing-plant-node")}
              style={{ transformOrigin: "165px 178px" }}
            />

            {/* Reduced motion: show full plant without animation classes — handled by anim=false showing all at full opacity via no keyframe start at 0 */}
          </svg>
        </div>
      </div>
    </section>
  );
}
