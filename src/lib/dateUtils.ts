/**
 * Indian Standard Time (IST, Asia/Kolkata) utilities.
 * All user-facing dates/times and date-range logic use IST.
 */

export const IST_TIMEZONE = "Asia/Kolkata";

const IST_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: IST_TIMEZONE,
  locale: "en-IN",
};

/**
 * Format a date for display in Indian Standard Time.
 */
export function formatIST(
  date: Date | string | number,
  format:
    | "PPpp"
    | "PPp"
    | "MMM d, yyyy"
    | "MMM d, HH:mm"
    | "yyyy-MM-dd"
    | "MMM d, yyyy HH:mm:ss"
    | "EEE MM/dd"
): string {
  const d = typeof date === "object" && "getTime" in date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";

  switch (format) {
    case "PPpp":
      return d.toLocaleString("en-IN", {
        ...IST_OPTIONS,
        dateStyle: "medium",
        timeStyle: "medium",
      });
    case "PPp":
      return d.toLocaleString("en-IN", {
        ...IST_OPTIONS,
        dateStyle: "medium",
        timeStyle: "short",
      });
    case "MMM d, yyyy":
      return d.toLocaleDateString("en-IN", {
        ...IST_OPTIONS,
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    case "MMM d, HH:mm":
      return d.toLocaleString("en-IN", {
        ...IST_OPTIONS,
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    case "yyyy-MM-dd": {
      const parts = d.toLocaleDateString("en-CA", { ...IST_OPTIONS }).split("-");
      return parts.length === 3 ? `${parts[0]}-${parts[1]}-${parts[2]}` : d.toISOString().slice(0, 10);
    }
    case "MMM d, yyyy HH:mm:ss":
      return d.toLocaleString("en-IN", {
        ...IST_OPTIONS,
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    case "EEE MM/dd":
      return d.toLocaleDateString("en-IN", {
        ...IST_OPTIONS,
        weekday: "short",
        month: "2-digit",
        day: "2-digit",
      });
    default:
      return d.toLocaleString("en-IN", IST_OPTIONS);
  }
}

/**
 * Start of day (00:00:00.000) in IST for date string yyyy-MM-dd.
 * Returns a Date (UTC) for use in ISO queries.
 */
export function getStartOfDayIST(dateStr: string): Date {
  return new Date(`${dateStr.trim()}T00:00:00+05:30`);
}

/**
 * End of day (23:59:59.999) in IST for date string yyyy-MM-dd.
 * Returns a Date (UTC) for use in ISO queries.
 */
export function getEndOfDayIST(dateStr: string): Date {
  return new Date(`${dateStr.trim()}T23:59:59.999+05:30`);
}

/**
 * Current date in IST as yyyy-MM-dd (e.g. for filenames or default picker).
 */
export function todayIST(): string {
  return formatIST(new Date(), "yyyy-MM-dd");
}
