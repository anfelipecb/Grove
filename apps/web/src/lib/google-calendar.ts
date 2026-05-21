export type GoogleTokenShape = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope: string;
};

type GoogleToken = GoogleTokenShape;

type CalendarEvent = {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

async function refreshAccessToken(token: GoogleToken): Promise<GoogleToken> {
  if (!token.refresh_token) throw new Error("No refresh token");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: token.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("Token refresh failed");

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    ...token,
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

export async function getValidToken(
  token: GoogleToken,
): Promise<{ token: GoogleToken; refreshed: boolean }> {
  if (Date.now() < token.expires_at - 60_000) {
    return { token, refreshed: false };
  }
  const refreshed = await refreshAccessToken(token);
  return { token: refreshed, refreshed: true };
}

export async function fetchCalendarEvents(
  token: GoogleToken,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token.access_token}` } },
  );

  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    throw new Error(`Calendar API error: ${res.status}`);
  }

  const data = (await res.json()) as { items?: CalendarEvent[] };
  return data.items ?? [];
}

export function busyBlocksFromEvents(
  events: CalendarEvent[],
): { start: string; end: string; title: string }[] {
  return events
    .filter((e) => e.start.dateTime) // all-day events have no dateTime
    .map((e) => ({
      start: e.start.dateTime!,
      end: e.end.dateTime!,
      title: e.summary ?? "Busy",
    }));
}
