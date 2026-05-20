export const LIFE_DOMAINS = [
  {
    id: "wellbeing",
    label: "Wellbeing",
    description: "Your health, energy, sleep, and daily physical care",
    examples: ["exercise", "sleep", "food", "medication", "mood"],
  },
  {
    id: "learning",
    label: "Learning",
    description: "Skills, courses, reading, and intellectual growth",
    examples: ["courses", "reading", "AI agents", "research"],
  },
  {
    id: "work_build",
    label: "Work/Build",
    description: "Projects, career, clients, and things you're building",
    examples: ["projects", "shipping", "career", "portfolio"],
  },
  {
    id: "relationships",
    label: "Relationships",
    description: "Family, friends, partners, and meaningful connections",
    examples: ["family", "friends", "mentors", "support network"],
  },
  {
    id: "community",
    label: "Community",
    description: "Group belonging, volunteering, and showing up for others",
    examples: ["sessions", "organizing", "peer help", "shared resources"],
  },
  {
    id: "life_admin",
    label: "Life Admin",
    description: "Logistics, finances, emails, and the tasks that keep life running",
    examples: ["forms", "money", "appointments", "email"],
  },
  {
    id: "rest_play",
    label: "Rest/Play",
    description: "Recovery, fun, hobbies, and intentional downtime",
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
