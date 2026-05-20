"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { WizardStepConfirm } from "@/components/v2/coach/wizard-step-confirm";
import {
  WizardStepSchedule,
  type ProposedScheduleItem,
} from "@/components/v2/coach/wizard-step-schedule";
import { WizardStepIntentions } from "@/components/v2/coach/wizard-step-intentions";
import { WizardStepIntake } from "@/components/v2/coach/wizard-step-intake";
import { WizardStepTasks } from "@/components/v2/coach/wizard-step-tasks";
import type { CoachGoalDraft, CoachSuggestedTask } from "@/components/v2/coach/types";

type ParsedIntention = {
  domain: LifeDomainId;
  rationale: string;
  sampleGoal: string;
};

type ParseIntentionsPayload = {
  intentions?: ParsedIntention[];
  safety?: boolean;
  message?: string;
  error?: string;
};

type Props = {
  demoMode: boolean;
  editingGoalId?: string | null;
  initialDisplayName?: string;
  initialDomainId?: LifeDomainId | null;
  initialStep?: number;
  initialUserInput?: string;
  onCancel?: () => void;
  profileId: string | null;
};

function domainLabel(domainId: LifeDomainId): string {
  return LIFE_DOMAINS.find((domain) => domain.id === domainId)?.label ?? "Selected domain";
}

function suggestPointValue(frequency: CoachSuggestedTask["frequency"], isRequired: boolean): number {
  if (frequency === "weekly") {
    return isRequired ? 22 : 18;
  }

  if (frequency === "once") {
    return isRequired ? 18 : 14;
  }

  return isRequired ? 12 : 10;
}

function buildDefaultTasks(goalTitle: string, domainId: LifeDomainId): CoachSuggestedTask[] {
  const label = domainLabel(domainId).toLowerCase();
  const focus = goalTitle.trim() || `your ${label} focus`;

  return [
    {
      title: `Start with one 10-minute ${label} action for ${focus}`,
      frequency: "daily",
      isRequired: true,
      pointValue: suggestPointValue("daily", true),
    },
    {
      title: `Block one focused session that moves ${focus} forward`,
      frequency: "weekly",
      isRequired: false,
      pointValue: suggestPointValue("weekly", false),
    },
  ];
}

function buildGoalDraftFromIntention(intention: ParsedIntention, key: string): CoachGoalDraft {
  return {
    key,
    title: intention.sampleGoal,
    domain: intention.domain,
    rationale: intention.rationale,
    custom: false,
    tasks: buildDefaultTasks(intention.sampleGoal, intention.domain).map((task, index) => ({
      ...task,
      id: `${key}-${index}`,
      enabled: true,
    })),
  };
}

function buildEditSeedIntention(domainId: LifeDomainId, goalTitle: string): ParsedIntention {
  const label = domainLabel(domainId);

  return {
    domain: domainId,
    rationale: `Your current goal "${goalTitle.trim()}" already maps to ${label}.`,
    sampleGoal: goalTitle.trim() || `Refine your ${label.toLowerCase()} goal`,
  };
}

export function CoachWizard({
  demoMode,
  editingGoalId = null,
  initialDisplayName = "Member",
  initialDomainId = null,
  initialStep = 0,
  initialUserInput = "",
  onCancel,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [promptText, setPromptText] = useState(initialUserInput);
  const [intentions, setIntentions] = useState<ParsedIntention[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [goalDrafts, setGoalDrafts] = useState<CoachGoalDraft[]>([]);
  const [loadingIntentions, setLoadingIntentions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [acceptedSchedule, setAcceptedSchedule] = useState<ProposedScheduleItem[] | null>(null);

  const maxSelections = editingGoalId ? 1 : 3;

  useEffect(() => {
    if (initialStep < 1 || !editingGoalId || !initialDomainId || !promptText.trim()) {
      return;
    }

    setIntentions([buildEditSeedIntention(initialDomainId, promptText)]);
    setSelectedKeys(["intention-0"]);
  }, [editingGoalId, initialDomainId, initialStep, promptText]);

  async function loadIntentions(prompt: string) {
    setLoadingIntentions(true);
    setError(null);
    setSafetyMessage(null);

    try {
      const response = await fetch("/api/v2/coach/parse-intentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoMode, prompt }),
      });

      const payload = (await response.json()) as ParseIntentionsPayload;

      if (payload.safety) {
        setSafetyMessage(payload.message ?? "Grove cannot safely continue this as a coaching request.");
        setIntentions([]);
        setSelectedKeys([]);
        return false;
      }

      if (!response.ok) {
        setError(payload.error ?? "Could not map your intentions into starter goals.");
        return false;
      }

      const nextIntentions = payload.intentions ?? [];
      if (nextIntentions.length === 0) {
        setError("Coach could not map that into starter goals yet.");
        return false;
      }

      setIntentions(nextIntentions);
      setSelectedKeys([]);
      return true;
    } catch {
      setError("Could not map your intentions into starter goals.");
      return false;
    } finally {
      setLoadingIntentions(false);
    }
  }

  function handlePromptChange(value: string) {
    setPromptText(value.slice(0, 400));
    setError(null);
    setSafetyMessage(null);
  }

  async function continueFromIntake() {
    const nextPrompt = promptText.trim();
    if (!nextPrompt) {
      setError("Write the 2 or 3 things you want to improve first.");
      return;
    }

    const ok = await loadIntentions(nextPrompt);
    if (ok) {
      setStep(1);
    }
  }

  function toggleSelectedKey(key: string) {
    let exceededLimit = false;

    setSelectedKeys((current) => {
      if (editingGoalId) {
        return current.includes(key) ? [] : [key];
      }

      if (current.includes(key)) {
        return current.filter((entry) => entry !== key);
      }

      if (current.length >= maxSelections) {
        exceededLimit = true;
        return current;
      }

      return [...current, key];
    });

    if (exceededLimit) {
      setError(`Pick up to ${maxSelections} starter goals.`);
      return;
    }

    setError(null);
  }

  function continueFromIntentions() {
    const selectedIntentions = intentions.flatMap((intention, index) =>
      selectedKeys.includes(`intention-${index}`) ? [buildGoalDraftFromIntention(intention, `intention-${index}`)] : [],
    );

    if (selectedIntentions.length === 0) {
      setError(editingGoalId ? "Pick the goal that should replace this one." : "Select at least one starter goal.");
      return;
    }

    if (editingGoalId && selectedIntentions.length !== 1) {
      setError("Editing one goal only supports one replacement goal.");
      return;
    }

    setError(null);
    setGoalDrafts(selectedIntentions);
    setStep(2);
  }

  function toggleTask(goalKey: string, taskId: string) {
    setGoalDrafts((current) =>
      current.map((goal) =>
        goal.key !== goalKey
          ? goal
          : {
              ...goal,
              tasks: goal.tasks.map((task) => (task.id === taskId ? { ...task, enabled: !task.enabled } : task)),
            },
      ),
    );
  }

  function continueFromTasks() {
    const hasEnabledTask = goalDrafts.some((goal) => goal.tasks.some((task) => task.enabled));

    if (!hasEnabledTask) {
      setError("Leave at least one task enabled so Coach has something to create.");
      return;
    }

    setError(null);
    setAcceptedSchedule(null);
    setStep(3);
  }

  function continueFromSchedule(items: ProposedScheduleItem[]) {
    setAcceptedSchedule(items);
    setError(null);
    setStep(4);
  }

  function skipSchedule() {
    setAcceptedSchedule(null);
    setError(null);
    setStep(4);
  }

  async function confirmSetup() {
    const payloadGoals = goalDrafts
      .map((goal) => ({
        title: goal.title,
        domain: goal.domain,
        tasks: goal.tasks
          .filter((task) => task.enabled)
          .map((task) => ({
            title: task.title,
            frequency: task.frequency,
            isRequired: task.isRequired,
            pointValue: task.pointValue,
          })),
      }))
      .filter((goal) => goal.tasks.length > 0);

    if (payloadGoals.length === 0) {
      setError("Leave at least one task enabled so Coach has something to create.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/v2/coach/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: initialDisplayName,
          editingGoalId,
          goals: payloadGoals,
          scheduledTasks: acceptedSchedule ?? undefined,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not save your starting system.");
        return;
      }

      router.push("/today");
      router.refresh();
    } catch {
      setError("Could not save your starting system.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Coach</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Build a lighter daily system for {initialDisplayName}. Coach will turn goals into small tasks that feel
            possible to act on.
          </p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Cancel
          </button>
        ) : null}
      </div>

      {step === 0 ? (
        <WizardStepIntake
          error={error}
          loading={loadingIntentions}
          onContinue={continueFromIntake}
          onPromptChange={handlePromptChange}
          promptText={promptText}
          safetyMessage={safetyMessage}
        />
      ) : null}

      {step === 1 ? (
        <WizardStepIntentions
          editingMode={Boolean(editingGoalId)}
          error={error}
          intentions={intentions}
          loading={loadingIntentions}
          maxSelections={maxSelections}
          onBack={() => {
            setError(null);
            setStep(0);
          }}
          onContinue={continueFromIntentions}
          onRefresh={() => void loadIntentions(promptText.trim())}
          onToggleKey={toggleSelectedKey}
          promptText={promptText}
          selectedKeys={selectedKeys}
        />
      ) : null}

      {step === 2 ? (
        <WizardStepTasks
          error={error}
          goals={goalDrafts}
          onBack={() => {
            setError(null);
            setStep(1);
          }}
          onContinue={continueFromTasks}
          onToggleTask={toggleTask}
        />
      ) : null}

      {step === 3 ? (
        <WizardStepSchedule
          error={error}
          goals={goalDrafts}
          onBack={() => {
            setError(null);
            setStep(2);
          }}
          onSkip={skipSchedule}
          onAccept={continueFromSchedule}
        />
      ) : null}

      {step === 4 ? (
        <WizardStepConfirm
          error={error}
          goals={goalDrafts}
          onBack={() => {
            setError(null);
            setStep(3);
          }}
          onConfirm={() => void confirmSetup()}
          submitting={submitting}
        />
      ) : null}
    </div>
  );
}
