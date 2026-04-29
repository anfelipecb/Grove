export const LIFE_DOMAINS = [
  {
    id: "wellbeing",
    label: "Wellbeing",
    examples: ["exercise", "sleep", "food", "medication", "mood"],
  },
  {
    id: "learning",
    label: "Learning",
    examples: ["courses", "reading", "AI agents", "research"],
  },
  {
    id: "work_build",
    label: "Work/Build",
    examples: ["projects", "shipping", "career", "portfolio"],
  },
  {
    id: "relationships",
    label: "Relationships",
    examples: ["family", "friends", "mentors", "support network"],
  },
  {
    id: "community",
    label: "Community",
    examples: ["sessions", "organizing", "peer help", "shared resources"],
  },
  {
    id: "life_admin",
    label: "Life Admin",
    examples: ["forms", "money", "appointments", "email"],
  },
  {
    id: "rest_play",
    label: "Rest/Play",
    examples: ["rest", "hobbies", "games", "unstructured time"],
  },
] as const;

export type LifeDomainId = (typeof LIFE_DOMAINS)[number]["id"];

export const DEFAULT_SUBAREAS: Record<LifeDomainId, string[]> = {
  wellbeing: ["Exercise", "Sleep", "Food"],
  learning: ["Coursework", "Reading", "AI agents"],
  work_build: ["Grove", "Portfolio", "Career"],
  relationships: ["Family", "Friends", "Mentors"],
  community: ["Sessions", "Peer help", "Shared resources"],
  life_admin: ["Email", "Calendar", "Forms"],
  rest_play: ["Rest", "Games", "Creative play"],
};

