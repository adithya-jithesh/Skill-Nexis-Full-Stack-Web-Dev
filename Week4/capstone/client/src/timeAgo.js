// "4m", "2h", "3d" - the way a feed states a time. Anything older than a week
// is a date, because "63d" tells nobody anything.
export function timeAgo(iso) {
  const then = new Date(iso);
  const seconds = Math.round((Date.now() - then.getTime()) / 1000);

  if (seconds < 45) return "just now";
  if (seconds < 3600) return Math.round(seconds / 60) + "m";
  if (seconds < 86400) return Math.round(seconds / 3600) + "h";
  if (seconds < 604800) return Math.round(seconds / 86400) + "d";

  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
