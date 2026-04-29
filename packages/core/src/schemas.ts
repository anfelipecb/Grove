import { z } from "zod";

export const memberProfileCardSchema = z.object({
  summary: z.string().min(20),
  supportStyle: z.enum(["brief", "structured", "gentle", "direct"]),
  likelyFriction: z.array(z.string()).max(5),
  firstTargets: z.array(z.string()).min(1).max(3),
  communityEntryPoint: z.string().min(5),
  nudgeGuidelines: z.array(z.string()).min(1).max(5),
});

export const xpSuggestionSchema = z.object({
  effort: z.enum(["tiny", "small", "medium", "large", "deep"]),
  resistance: z.enum(["low", "medium", "high", "avoidant"]),
  value: z.enum(["nice", "important", "critical"]),
  urgent: z.boolean().default(false),
  communityContribution: z.boolean().default(false),
  rationale: z.string().min(10),
});

export const nudgeDraftSchema = z.object({
  channel: z.enum(["in_app", "email"]),
  tone: z.enum(["brief", "structured", "gentle", "direct"]),
  subject: z.string().max(80),
  body: z.string().max(600),
  callToAction: z.string().max(120),
});

export const sessionSummarySchema = z.object({
  title: z.string().min(3),
  shortSummary: z.string().min(20),
  decisions: z.array(z.string()).max(8),
  commitments: z.array(
    z.object({
      ownerName: z.string(),
      task: z.string(),
      dueAt: z.string().optional(),
    }),
  ),
  newcomerContext: z.string().min(20),
});

export const resourceSummarySchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(20).max(500),
  tags: z.array(z.string()).max(6),
});

export type MemberProfileCard = z.infer<typeof memberProfileCardSchema>;
export type AiXpSuggestion = z.infer<typeof xpSuggestionSchema>;
export type NudgeDraft = z.infer<typeof nudgeDraftSchema>;
export type SessionSummary = z.infer<typeof sessionSummarySchema>;
export type ResourceSummary = z.infer<typeof resourceSummarySchema>;

