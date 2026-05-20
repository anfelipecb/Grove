"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Loader2, Mail, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CoordinationSuggestion, InviteStatus } from "@/lib/v2/community-coordination";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-moss/40";

export type CommunityInviteView = {
  id: string;
  communityId: string;
  communityName: string;
  inviterName: string;
  inviteeEmail: string;
  activityTitle: string;
  message: string | null;
  goalContext: string | null;
  proposedDate: string | null;
  proposedStartTime: string | null;
  durationMinutes: number;
  status: InviteStatus;
  counterDate: string | null;
  counterStartTime: string | null;
  responseNote: string | null;
  isIncoming: boolean;
  isInviter: boolean;
};

export type CommunityPlanView = {
  id: string;
  communityName: string;
  title: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  participantNames: string[];
};

type Props = {
  communityId?: string;
  communityName?: string;
  invites: CommunityInviteView[];
  plans: CommunityPlanView[];
  canCreate: boolean;
};

type SuggestResponse = {
  suggestions?: CoordinationSuggestion[];
  sharedAvailabilityFound?: boolean;
  recipientFound?: boolean;
  error?: string;
};

function formatSlot(date: string | null, time: string | null, durationMinutes: number) {
  if (!date || !time) return "Time still needs a proposal";
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}–${end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

export function BuddyCoordinationPanel({ communityId, communityName, invites, plans, canCreate }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    inviteeEmail: "",
    activityTitle: "",
    goalContext: "",
    proposedDate: "",
    proposedStartTime: "",
    durationMinutes: "60",
    message: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);
  const [successHref, setSuccessHref] = useState<string | null>(null);
  const [mailtoHref, setMailtoHref] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CoordinationSuggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [counterForms, setCounterForms] = useState<Record<string, { date: string; time: string; note: string }>>({});

  const queue = useMemo(
    () => invites.filter((invite) => invite.status === "pending" || invite.status === "proposed"),
    [invites],
  );

  function setCounter(inviteId: string, key: "date" | "time" | "note", value: string) {
    setCounterForms((current) => ({
      ...current,
      [inviteId]: {
        date: current[inviteId]?.date ?? "",
        time: current[inviteId]?.time ?? "",
        note: current[inviteId]?.note ?? "",
        [key]: value,
      },
    }));
  }

  async function requestSuggestions() {
    if (!form.inviteeEmail.trim()) {
      setCreateError("Add the invitee email first.");
      return;
    }
    setCreateError(null);
    setSuggesting(true);
    setSuggestionNote(null);
    try {
      const res = await fetch("/api/v2/community/invites/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteeEmail: form.inviteeEmail,
          durationMinutes: Number(form.durationMinutes) || 60,
        }),
      });
      const data = (await res.json()) as SuggestResponse;
      if (!res.ok) {
        setCreateError(data.error ?? "Could not generate suggestions.");
        return;
      }
      setSuggestions(data.suggestions ?? []);
      if (!data.recipientFound) {
        setSuggestionNote("Mycelium only has your schedule so far. The recipient can still counter-propose.");
      } else if (!data.sharedAvailabilityFound) {
        setSuggestionNote("No obvious overlap yet, so Mycelium suggested your best windows to start the conversation.");
      } else {
        setSuggestionNote("Mycelium found shared windows you can use as the first proposal.");
      }
    } finally {
      setSuggesting(false);
    }
  }

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!communityId) return;
    setCreatePending(true);
    setCreateError(null);
    setSuccessHref(null);
    setMailtoHref(null);
    try {
      const res = await fetch("/api/v2/community/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId,
          inviteeEmail: form.inviteeEmail,
          activityTitle: form.activityTitle,
          goalContext: form.goalContext || null,
          proposedDate: form.proposedDate,
          proposedStartTime: form.proposedStartTime,
          durationMinutes: Number(form.durationMinutes) || 60,
          message: form.message || null,
        }),
      });
      const data = (await res.json()) as { error?: string; inviteLink?: string; mailtoHref?: string };
      if (!res.ok) {
        setCreateError(data.error ?? "Could not send invite.");
        return;
      }
      setForm({
        inviteeEmail: "",
        activityTitle: "",
        goalContext: "",
        proposedDate: "",
        proposedStartTime: "",
        durationMinutes: "60",
        message: "",
      });
      setSuggestions([]);
      setSuggestionNote(null);
      setSuccessHref(data.inviteLink ?? null);
      setMailtoHref(data.mailtoHref ?? null);
      router.refresh();
    } finally {
      setCreatePending(false);
    }
  }

  async function actOnInvite(
    inviteId: string,
    action: "accept" | "decline" | "propose" | "confirm_proposal" | "cancel",
  ) {
    setActionPending(inviteId + action);
    setActionError(null);
    try {
      const counter = counterForms[inviteId];
      const res = await fetch(`/api/v2/community/invites/${inviteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          counterDate: counter?.date || undefined,
          counterStartTime: counter?.time || undefined,
          responseNote: counter?.note || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setActionError(data.error ?? "Could not update invite.");
        return;
      }
      router.refresh();
    } finally {
      setActionPending(null);
    }
  }

  return (
    <div className="space-y-5">
      {canCreate ? (
        <section className="rounded-xl border border-border/60 bg-card">
          <div className="border-b border-border/50 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-moss" />
              Invite a buddy
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Start with one concrete activity and one proposed time. Mycelium can suggest overlap windows first.
            </p>
          </div>
          <form className="space-y-3 p-4" onSubmit={submitInvite}>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Invitee email</span>
              <input
                value={form.inviteeEmail}
                onChange={(e) => setForm((current) => ({ ...current, inviteeEmail: e.target.value }))}
                className={inputClass}
                type="email"
                placeholder="buddy@example.com"
                disabled={createPending}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Activity</span>
              <input
                value={form.activityTitle}
                onChange={(e) => setForm((current) => ({ ...current, activityTitle: e.target.value }))}
                className={inputClass}
                placeholder="Gym buddy session"
                disabled={createPending}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Goal context</span>
              <input
                value={form.goalContext}
                onChange={(e) => setForm((current) => ({ ...current, goalContext: e.target.value }))}
                className={inputClass}
                placeholder="Exercise 2x a week"
                disabled={createPending}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1 sm:col-span-1">
                <span className="text-xs font-medium text-muted-foreground">Date</span>
                <input
                  value={form.proposedDate}
                  onChange={(e) => setForm((current) => ({ ...current, proposedDate: e.target.value }))}
                  className={inputClass}
                  type="date"
                  disabled={createPending}
                />
              </label>
              <label className="block space-y-1 sm:col-span-1">
                <span className="text-xs font-medium text-muted-foreground">Start</span>
                <input
                  value={form.proposedStartTime}
                  onChange={(e) => setForm((current) => ({ ...current, proposedStartTime: e.target.value }))}
                  className={inputClass}
                  type="time"
                  disabled={createPending}
                />
              </label>
              <label className="block space-y-1 sm:col-span-1">
                <span className="text-xs font-medium text-muted-foreground">Minutes</span>
                <input
                  value={form.durationMinutes}
                  onChange={(e) => setForm((current) => ({ ...current, durationMinutes: e.target.value }))}
                  className={inputClass}
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  disabled={createPending}
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Message</span>
              <textarea
                value={form.message}
                onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
                className={`${inputClass} resize-none`}
                rows={2}
                placeholder="Want a Tuesday/Thursday gym rhythm together?"
                disabled={createPending}
              />
            </label>
            {suggestions.length > 0 ? (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-moss" />
                  Mycelium suggestions
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.date}-${suggestion.start}`}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          proposedDate: suggestion.date,
                          proposedStartTime: suggestion.start,
                        }))
                      }
                      className="rounded-full border border-moss/30 bg-moss/10 px-3 py-1 text-xs font-medium text-moss hover:bg-moss/15"
                    >
                      {formatSlot(suggestion.date, suggestion.start, Number(form.durationMinutes) || 60)}
                    </button>
                  ))}
                </div>
                {suggestionNote ? <p className="mt-2 text-[11px] text-muted-foreground">{suggestionNote}</p> : null}
              </div>
            ) : null}
            {createError ? <p className="text-xs text-red-600 dark:text-red-400">{createError}</p> : null}
            {successHref ? (
              <div className="rounded-lg border border-moss/30 bg-moss/5 p-3 text-xs text-foreground">
                <p>Invite queued in Grove for this email.</p>
                {mailtoHref ? (
                  <a href={mailtoHref} className="mt-2 inline-flex items-center gap-1 font-medium text-moss hover:text-moss/80">
                    <Mail className="h-3.5 w-3.5" />
                    Open email draft
                  </a>
                ) : null}
                <p className="mt-2 text-muted-foreground">Invite link: {successHref}</p>
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void requestSuggestions()}
                disabled={suggesting || createPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40 disabled:opacity-50"
              >
                {suggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Ask Mycelium for times
              </button>
              <button
                type="submit"
                disabled={createPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-moss px-4 py-2 text-sm font-medium text-moss-fg hover:bg-moss/90 disabled:opacity-50"
              >
                {createPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send invite
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="rounded-xl border border-border/60 bg-card">
        <div className="border-b border-border/50 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarRange className="h-4 w-4 text-moss" />
            Coordination inbox
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Pending invites, counter-proposals, and confirmations for {communityName ?? "your communities"}.
          </p>
        </div>
        <div className="space-y-3 p-4">
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invites are waiting on a response right now.</p>
          ) : (
            queue.map((invite) => {
              const counter = counterForms[invite.id] ?? { date: "", time: "", note: "" };
              const title =
                invite.status === "proposed"
                  ? `${invite.inviterName} needs your confirmation`
                  : invite.isIncoming
                  ? `${invite.inviterName} invited you`
                  : `Waiting on ${invite.inviteeEmail}`;

              return (
                <article key={invite.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{invite.communityName}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium capitalize text-muted-foreground">
                      {invite.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{invite.activityTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Proposed: {formatSlot(invite.proposedDate, invite.proposedStartTime, invite.durationMinutes)}
                  </p>
                  {invite.counterDate && invite.counterStartTime ? (
                    <p className="mt-1 text-xs text-moss">
                      Counter: {formatSlot(invite.counterDate, invite.counterStartTime, invite.durationMinutes)}
                    </p>
                  ) : null}
                  {invite.goalContext ? <p className="mt-1 text-xs text-muted-foreground">Goal: {invite.goalContext}</p> : null}
                  {invite.message ? <p className="mt-2 text-sm text-muted-foreground">{invite.message}</p> : null}
                  {invite.responseNote ? <p className="mt-2 text-xs text-muted-foreground">Last note: {invite.responseNote}</p> : null}

                  {invite.isIncoming && invite.status === "pending" ? (
                    <div className="mt-3 space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="date"
                          value={counter.date}
                          onChange={(e) => setCounter(invite.id, "date", e.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="time"
                          value={counter.time}
                          onChange={(e) => setCounter(invite.id, "time", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={counter.note}
                        onChange={(e) => setCounter(invite.id, "note", e.target.value)}
                        className={`${inputClass} resize-none`}
                        placeholder="Optional note"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void actOnInvite(invite.id, "accept")}
                          disabled={actionPending === invite.id + "accept"}
                          className="rounded-lg bg-moss px-3 py-2 text-xs font-medium text-moss-fg hover:bg-moss/90 disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => void actOnInvite(invite.id, "propose")}
                          disabled={actionPending === invite.id + "propose"}
                          className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/40 disabled:opacity-50"
                        >
                          Propose new time
                        </button>
                        <button
                          type="button"
                          onClick={() => void actOnInvite(invite.id, "decline")}
                          disabled={actionPending === invite.id + "decline"}
                          className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {invite.isInviter && invite.status === "proposed" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void actOnInvite(invite.id, "confirm_proposal")}
                        disabled={actionPending === invite.id + "confirm_proposal"}
                        className="rounded-lg bg-moss px-3 py-2 text-xs font-medium text-moss-fg hover:bg-moss/90 disabled:opacity-50"
                      >
                        Confirm counter-proposal
                      </button>
                      <button
                        type="button"
                        onClick={() => void actOnInvite(invite.id, "cancel")}
                        disabled={actionPending === invite.id + "cancel"}
                        className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
          {actionError ? <p className="text-xs text-red-600 dark:text-red-400">{actionError}</p> : null}
        </div>
      </section>

      {canCreate || plans.length > 0 ? (
        <section className="rounded-xl border border-border/60 bg-card">
          <div className="border-b border-border/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Confirmed plans</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              These are the active buddy plans that also appear on the v2 calendar.
            </p>
          </div>
          <div className="space-y-3 p-4">
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No confirmed buddy plans yet.</p>
            ) : (
              plans.map((plan) => (
                <article key={plan.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-sm font-semibold text-foreground">{plan.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.communityName}</p>
                  <p className="mt-2 text-sm text-foreground">{formatSlot(plan.scheduledDate, plan.startTime, plan.durationMinutes)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    With {plan.participantNames.length > 0 ? plan.participantNames.join(", ") : "community members"}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
