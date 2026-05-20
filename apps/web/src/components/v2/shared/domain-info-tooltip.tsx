"use client";

import { useEffect, useRef, useState } from "react";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";

type DomainInfoTooltipProps = {
  domainId: LifeDomainId;
};

export function DomainInfoTooltip({ domainId }: DomainInfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const domain = LIFE_DOMAINS.find((d) => d.id === domainId);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (!domain) return null;

  const examples = domain.examples.slice(0, 3).join(", ");

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={`About ${domain.label}`}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
      >
        ⓘ
      </button>
      {open ? (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-2xl border border-white/[0.08] bg-card/95 p-3 text-sm shadow-lg backdrop-blur-sm"
        >
          <span className="block font-semibold text-foreground">{domain.label}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {domain.description}
          </span>
          <span className="mt-2 block text-[11px] text-muted-foreground">
            e.g. {examples}
          </span>
        </span>
      ) : null}
    </span>
  );
}
