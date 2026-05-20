"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

const CYCLE_S = 18;

const storyBeats = [
  { id: "you", line: "You root your plan", detail: "Solo follow-through in Today and Coach." },
  { id: "help", line: "Help reaches in", detail: "Sessions, buddies, and nudges when friction spikes." },
  { id: "grove", line: "Your Grove grows together", detail: "Same plant. More branches. Not a second app." },
] as const;

export function LandingCommunityGrowth() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [beat, setBeat] = useState(0);

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
      setBeat(storyBeats.length - 1);
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

  useEffect(() => {
    if (!active || reducedMotion) return;
    const stepMs = (CYCLE_S * 1000) / storyBeats.length;
    const id = setInterval(() => setBeat((b) => (b + 1) % storyBeats.length), stepMs);
    return () => clearInterval(id);
  }, [active, reducedMotion]);

  const anim = active && !reducedMotion;
  const awaiting = !active && !reducedMotion;
  const plantAnim = (motionClass: string) =>
    twMerge(awaiting && "opacity-0", anim && motionClass);
  const cycleStyle = { animationDuration: `${CYCLE_S}s` } as CSSProperties;

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

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.44fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
        <div className="max-w-sm lg:max-w-none">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Your Grove</p>
          <h2
            id="landing-community-heading"
            className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl"
          >
            Grow with help.{" "}
            <span className="text-marigold">Grove</span> grows together.
          </h2>

          <div
            className="mt-6 min-h-[4.5rem]"
            aria-live="polite"
            aria-atomic="true"
          >
            {storyBeats.map((b, i) => (
              <div
                key={b.id}
                className={twMerge(
                  "transition motion-safe:duration-500",
                  beat === i ? "opacity-100" : "pointer-events-none absolute opacity-0",
                )}
              >
                <p className="text-base font-semibold text-white sm:text-lg">{b.line}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{b.detail}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-[11px] font-medium uppercase tracking-wider text-white/55">
            One plant · roots below · branches out
          </p>
        </div>

        <div
          className="relative mx-auto flex w-full max-w-lg items-end justify-center lg:max-w-none"
          style={{ "--plant-cycle": `${CYCLE_S}s` } as CSSProperties}
        >
          <svg
            viewBox="0 0 400 320"
            className="h-auto w-full max-h-[300px] drop-shadow-lg"
            role="img"
            aria-label="One plant in a Grove: roots grow down for you, stem rises, a branch reaches out with people as leaves when help arrives"
          >
            <defs>
              <linearGradient id="grove-soil" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
              </linearGradient>
              <linearGradient id="grove-stem" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#4a7a5c" />
                <stop offset="55%" stopColor="#6b9a78" />
                <stop offset="100%" stopColor="#9ec4a8" />
              </linearGradient>
              <linearGradient id="grove-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5f8f72" />
                <stop offset="100%" stopColor="#b8dcc4" />
              </linearGradient>
              <linearGradient id="grove-help" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(231,184,77,0.15)" />
                <stop offset="100%" stopColor="rgba(231,184,77,0.85)" />
              </linearGradient>
            </defs>

            {/* One-plant halo */}
            <ellipse
              cx="200"
              cy="175"
              rx="130"
              ry="145"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.5"
              strokeDasharray="6 10"
              className={plantAnim("motion-safe:animate-landing-plant-halo")}
              style={cycleStyle}
            />

            {/* Soil + Grove ground */}
            <g className={plantAnim("motion-safe:animate-landing-plant-soil")} style={cycleStyle}>
              <ellipse cx="200" cy="288" rx="135" ry="24" fill="url(#grove-soil)" />
              <text
                x="200"
                y="302"
                textAnchor="middle"
                className="fill-white/40 text-[10px] font-semibold uppercase tracking-[0.35em]"
                style={{ fontFamily: "inherit" }}
              >
                Grove
              </text>
            </g>

            {/* Roots — below soil, labeled */}
            <g
              className={plantAnim("motion-safe:animate-landing-plant-root")}
              style={{ ...cycleStyle, transformOrigin: "200px 268px" }}
            >
              <path
                d="M200 258 Q165 285 130 292"
                fill="none"
                stroke="rgba(255,255,255,0.42)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M200 262 L200 298"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M200 258 Q235 285 270 292"
                fill="none"
                stroke="rgba(255,255,255,0.42)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <text
                x="72"
                y="278"
                fill="rgba(167, 230, 195, 0.85)"
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ fontFamily: "inherit" }}
              >
                Roots · you
              </text>
            </g>

            {/* Trunk — single plant */}
            <path
              d="M200 258 L200 88"
              fill="none"
              stroke="url(#grove-stem)"
              strokeWidth="7"
              strokeLinecap="round"
              className={plantAnim("motion-safe:animate-landing-plant-stem")}
              style={{ ...cycleStyle, transformOrigin: "200px 258px" }}
            />

            {/* Solo leaf (left) */}
            <g
              className={plantAnim("motion-safe:animate-landing-plant-leaf-left")}
              style={{ ...cycleStyle, transformOrigin: "155px 175px" }}
            >
              <path
                d="M200 178 Q145 162 128 188 Q148 210 178 192 Z"
                fill="url(#grove-leaf)"
              />
            </g>

            {/* You — anchor node */}
            <circle
              cx="178"
              cy="192"
              r="10"
              fill="#a8d4b8"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5"
              className={plantAnim("motion-safe:animate-landing-plant-node")}
              style={{ ...cycleStyle, transformOrigin: "178px 192px" }}
            />

            {/* Help lines — reach from you to branch */}
            <g className={plantAnim("motion-safe:animate-landing-plant-help")} style={cycleStyle}>
              <path
                d="M178 192 Q215 155 248 118"
                fill="none"
                stroke="url(#grove-help)"
                strokeWidth="2"
                strokeDasharray="5 7"
                strokeLinecap="round"
              />
              <path
                d="M178 192 Q230 140 275 108"
                fill="none"
                stroke="rgba(231,184,77,0.55)"
                strokeWidth="1.5"
                strokeDasharray="4 8"
                strokeLinecap="round"
              />
            </g>

            {/* Branch — together */}
            <g
              className={plantAnim("motion-safe:animate-landing-plant-branch")}
              style={{ ...cycleStyle, transformOrigin: "200px 130px" }}
            >
              <path
                d="M200 138 Q245 118 285 98"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M285 98 Q305 88 318 102"
                fill="none"
                stroke="rgba(255,255,255,0.38)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <text
                x="308"
                y="88"
                fill="#e7b84d"
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ fontFamily: "inherit" }}
              >
                Together
              </text>
            </g>

            {/* Crown */}
            <g
              className={plantAnim("motion-safe:animate-landing-plant-leaf-top")}
              style={{ ...cycleStyle, transformOrigin: "200px 88px" }}
            >
              <path
                d="M200 88 Q182 48 200 32 Q218 48 200 88 Z"
                fill="url(#grove-leaf)"
                opacity="0.9"
              />
            </g>

            {/* Community leaves / people on branch */}
            <g
              className={anim ? "motion-safe:animate-landing-plant-sway" : undefined}
              style={{ transformOrigin: "250px 105px" }}
            >
              <circle
                cx="285"
                cy="98"
                r="12"
                fill="#e7b84d"
                className={plantAnim("motion-safe:animate-landing-plant-node")}
                style={{ ...cycleStyle, transformOrigin: "285px 98px", animationDelay: anim ? "0.08s" : undefined }}
              />
              <circle
                cx="318"
                cy="102"
                r="9"
                fill="rgba(255,255,255,0.92)"
                className={plantAnim("motion-safe:animate-landing-plant-node")}
                style={{ ...cycleStyle, transformOrigin: "318px 102px", animationDelay: anim ? "0.28s" : undefined }}
              />
              <circle
                cx="255"
                cy="112"
                r="7"
                fill="rgba(255,255,255,0.78)"
                className={plantAnim("motion-safe:animate-landing-plant-node")}
                style={{ ...cycleStyle, transformOrigin: "255px 112px", animationDelay: anim ? "0.45s" : undefined }}
              />
              {/* Small leaves on branch */}
              <path
                d="M268 108 Q252 100 248 112 Q258 120 268 108 Z"
                fill="url(#grove-leaf)"
                opacity="0.85"
                className={plantAnim("motion-safe:animate-landing-plant-node")}
                style={{ ...cycleStyle, transformOrigin: "258px 110px", animationDelay: anim ? "0.2s" : undefined }}
              />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
