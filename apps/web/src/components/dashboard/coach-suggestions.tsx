"use client";

import type { ReactNode } from "react";

export type CoachSuggestionItem = {
  title: string;
  domain: string;
  rationale: string;
};

export function CoachSuggestions({
  suggestions,
  loading,
  onAdopt,
}: {
  suggestions: CoachSuggestionItem[];
  loading: boolean;
  onAdopt: (item: CoachSuggestionItem) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card/90 p-4 shadow-sm dark:shadow-panel-dark sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coach suggestions</p>
        <div className="mt-3 space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-muted/60" />
          <div className="h-10 animate-pulse rounded-lg bg-muted/60" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const rows: ReactNode = suggestions.map((item, index) => (
    <div
      key={`${item.title}-${index}`}
      className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{item.title}</p>
        <p className="mt-0.5 text-xs capitalize text-muted-foreground">{item.domain.replaceAll("_", " ")}</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{item.rationale}</p>
      </div>
      <button
        type="button"
        onClick={() => onAdopt(item)}
        className="shrink-0 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-accent sm:py-2"
      >
        Add
      </button>
    </div>
  ));

  return (
    <div className="rounded-xl border border-border bg-card/90 p-4 shadow-sm dark:shadow-panel-dark sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coach suggestions</p>
      <div className="mt-3 space-y-3">{rows}</div>
    </div>
  );
}
