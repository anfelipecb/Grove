"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LIFE_DOMAINS, type LifeDomainId } from "@grove/core";
import { WizardStepConfirm } from "@/components/v2/coach/wizard-step-confirm";
import { WizardStepDomain } from "@/components/v2/coach/wizard-step-domain";
import { WizardStepGoals } from "@/components/v2/coach/wizard-step-goals";
import { WizardStepTasks } from "@/components/v2/coach/wizard-step-tasks";
import type { CoachGoalDraft, CoachGoalSuggestion, CoachSuggestedTask } from "@/components/v2/coach/types";

type SuggestGoalsPayload = {
  suggestions?: CoachGoalSuggestion[];
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

function buildGoalDraft(goal: CoachGoalSuggestion, key: string, custom = false): CoachGoalDraft {
  return {
    key,
    title: goal.title,
    domain: goal.domain,
    rationale: goal.rationale,
    custom,
    tasks: goal.tasks.map((task, index) => ({
      ...task,
      id: `${key}-${index}`,
      enabled: true,
    })),
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
  profileId,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [promptText, setPromptText] = useState(initialUserInput);
  const [selectedDomain, setSelectedDomain] = useState<LifeDomainId | null>(initialDomainId);
  const [suggestions, setSuggestions] = useState<CoachGoalSuggestion[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [customTitle, setCustomTitle] = useState("");
  const [goalDrafts, setGoalDrafts] = useState<CoachGoalDraft[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialStep < 1 || !selectedDomain || !promptText.trim()) {
      return;
    }

    void loadSuggestions(selectedDomain, promptText);
    // Intentional one-shot initialization for edit mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSuggestions(domainId: LifeDomainId, prompt: string) {
    setLoadingSuggestions(true);
    setError(null);
    setSafetyMessage(null);

    try {
      const response = await fetch("/api/v2/coach/suggest-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoMode, domain: domainId, prompt }),
      });

      const payload = (await response.json()) as SuggestGoalsPayload;

      if (payload.safety) {
        setSafetyMessage(payload.message ?? "Grove cannot safely continue this as a coaching request.");
        setSuggestions([]);
        return false;
      }

      if (!response.ok) {
        setError(payload.error ?? "Could not load goal suggestions.");
        return false;
      }

      const nextSuggestions = payload.suggestions ?? [];
      setSuggestions(nextSuggestions);
      setSelectedKeys([]);
      return true;
    } catch {
      setError("Could not load goal suggestions.");
      return false;
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function continueFromDomain() {
    if (!promptText.trim()) {
      setError("Describe the area you want to improve first.");
      return;
    }

    if (!selectedDomain) {
      setError("Pick one life domain so Coach can tailor the goal suggestions.");
      return;
    }

    const ok = await loadSuggestions(selectedDomain, promptText.trim());
    if (ok) {
      setStep(1);
    }
  }

  function toggleSelectedKey(key: string) {
    setSelectedKeys((current) => (current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]));
  }

  function continueFromGoals() {
    if (!selectedDomain) {
      setError("Choose a domain before continuing.");
      setStep(0);
      return;
    }

    const selectedSuggestions = suggestions.flatMap((suggestion, index) =>
      selectedKeys.includes(`suggestion-${index}`) ? [buildGoalDraft(suggestion, `suggestion-${index}`)] : [],
    );

    const includeCustom = selectedKeys.includes("custom");
    if (selectedSuggestions.length === 0 && !includeCustom) {
      setError("Select at least one suggested goal or choose Custom.");
      return;
    }

    if (includeCustom && !customTitle.trim()) {
      setError("Write your custom goal title before continuing.");
      return;
    }

    const customDraft =
      includeCustom && customTitle.trim()
        ? [
            buildGoalDraft(
              {
                title: customTitle.trim(),
                domain: selectedDomain,
                rationale: `Custom goal for ${domainLabel(selectedDomain)} based on your own wording.`,
                tasks: buildDefaultTasks(customTitle.trim(), selectedDomain),
              },
              "custom",
              true,
            ),
          ]
        : [];

    setError(null);
    setGoalDrafts([...selectedSuggestions, ...customDraft]);
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
    setStep(3);
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
        <WizardStepDomain
          error={error}
          loading={loadingSuggestions}
          onContinue={continueFromDomain}
          onPromptChange={setPromptText}
          onSelectDomain={setSelectedDomain}
          promptText={promptText}
          safetyMessage={safetyMessage}
          selectedDomain={selectedDomain}
        />
      ) : null}

      {step === 1 && selectedDomain ? (
        <WizardStepGoals
          customTitle={customTitle}
          domainId={selectedDomain}
          error={error}
          loading={loadingSuggestions}
          onBack={() => {
            setError(null);
            setStep(0);
          }}
          onContinue={continueFromGoals}
          onCustomTitleChange={setCustomTitle}
          onRefresh={() => void loadSuggestions(selectedDomain, promptText)}
          onToggleKey={toggleSelectedKey}
          promptText={promptText}
          selectedKeys={selectedKeys}
          suggestions={suggestions}
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
        <WizardStepConfirm
          error={error}
          goals={goalDrafts}
          onBack={() => {
            setError(null);
            setStep(2);
          }}
          onConfirm={() => void confirmSetup()}
          submitting={submitting}
        />
      ) : null}
    </div>
  );
}
