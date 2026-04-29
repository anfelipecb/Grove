import type { MemberProfileCard, NudgeDraft, SessionSummary } from "./schemas";

export type IntakeDraft = {
  name?: string;
  goals: string;
  friction: string;
  supportStyle: "brief" | "structured" | "gentle" | "direct";
  communityInterest: string;
  focusDisclosure?: string;
};

export function generateProfileCardFromIntake(intake: IntakeDraft): MemberProfileCard {
  const goals = splitList(intake.goals);
  const frictions = splitList(intake.friction);
  const community = intake.communityInterest.trim() || "Start by showing up to one session and sharing one useful note.";

  return {
    summary: `${intake.name || "This member"} is trying to turn broad intentions into visible next actions. Grove should keep the next step small, concrete, and connected to community participation.`,
    supportStyle: intake.supportStyle,
    likelyFriction: frictions.length > 0 ? frictions.slice(0, 5) : ["context switching", "unclear next steps"],
    firstTargets:
      goals.length > 0
        ? goals.slice(0, 3).map((goal) => `Define the next 25-minute action for: ${goal}`)
        : ["Choose one concrete goal for this week"],
    communityEntryPoint: community,
    nudgeGuidelines: [
      "Keep nudges short and non-judgmental.",
      "Ask for the next visible action instead of demanding a full plan.",
      "Tie community commitments to a clear time, place, or session.",
    ],
  };
}

export function summarizeSessionNotesLocally({
  title,
  notes,
}: {
  title: string;
  notes: string;
}): SessionSummary {
  const lines = splitLines(notes);
  const commitments = lines
    .filter((line) => /\b(will|todo|to do|commit|owner|by friday|by monday|next)\b/i.test(line))
    .slice(0, 6)
    .map((line) => {
      const [ownerCandidate, ...rest] = line.split(":");
      const hasOwner = rest.length > 0 && ownerCandidate.length < 40;

      return {
        ownerName: hasOwner ? ownerCandidate.trim() : "Unassigned",
        task: hasOwner ? rest.join(":").trim() : line,
      };
    });

  const decisions = lines
    .filter((line) => /\b(decided|agreed|choose|ship|priority|focus)\b/i.test(line))
    .slice(0, 6);

  return {
    title: title.trim() || "Community session",
    shortSummary:
      lines.slice(0, 3).join(" ") ||
      "The session needs notes before Mycelium can preserve useful community memory.",
    decisions: decisions.length > 0 ? decisions : ["No explicit decisions detected yet."],
    commitments:
      commitments.length > 0
        ? commitments
        : [{ ownerName: "Unassigned", task: "Clarify the next community commitment." }],
    newcomerContext:
      "A newcomer should read the summary, then look at the extracted commitments to see what the community is building next.",
  };
}

export function draftAccountabilityNudge({
  target,
  supportStyle,
  communityContext,
}: {
  target: string;
  supportStyle: MemberProfileCard["supportStyle"];
  communityContext?: string;
}): NudgeDraft {
  const body =
    supportStyle === "direct"
      ? `You said this matters: ${target}. Pick the next 10-minute move and do only that.`
      : `Quick reset: ${target}. What is the smallest visible step you can take in the next 10 minutes?`;

  return {
    channel: "in_app",
    tone: supportStyle,
    subject: "Small next step",
    body: communityContext ? `${body} This also helps ${communityContext}.` : body,
    callToAction: "Choose one next action",
  };
}

function splitList(input: string) {
  return input
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(input: string) {
  return input
    .split(/\n+/)
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);
}

