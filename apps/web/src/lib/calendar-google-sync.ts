import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCalendarEvents, getValidToken, type GoogleTokenShape } from "@/lib/google-calendar";

export type CalendarSyncStatus = "disconnected" | "ok" | "error";

export type GoogleBusyResult = {
  busy: { title: string; start: string; end: string }[];
  status: CalendarSyncStatus;
  error?: string;
};

export async function fetchGoogleBusyForDay(
  supabase: SupabaseClient,
  profileId: string,
  tokenJson: GoogleTokenShape,
  date: string,
): Promise<GoogleBusyResult> {
  try {
    const { token, refreshed } = await getValidToken(tokenJson);
    if (refreshed) {
      await supabase
        .from("profiles")
        .update({ google_calendar_token: token })
        .eq("id", profileId);
    }

    const timeMin = new Date(date + "T00:00:00").toISOString();
    const timeMax = new Date(date + "T23:59:59").toISOString();
    const events = await fetchCalendarEvents(token, timeMin, timeMax);
    const busy = events
      .filter((e) => e.start.dateTime)
      .map((e) => ({
        title: e.summary ?? "Busy",
        start: e.start.dateTime!,
        end: e.end.dateTime!,
      }));

    return { busy, status: "ok" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Calendar sync failed";
    return { busy: [], status: "error", error: message };
  }
}
