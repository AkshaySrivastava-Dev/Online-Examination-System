/**
 * Formatting Utilities for ExamPro
 */

/**
 * Format an ISO date string to a localized readable date.
 * Example: '2026-11-05T00:00:00.000Z' -> 'Nov 5, 2026'
 */
export const formatDate = (isoString) => {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

/**
 * Format an ISO date string to localized date and time.
 * Example: '2026-11-05T14:30:00.000Z' -> 'Nov 5, 2026, 02:30 PM'
 */
export const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

/**
 * Format duration in minutes to human readable string.
 * Example: 90 -> '1 hr 30 mins', 45 -> '45 mins'
 */
export const formatDuration = (minutes) => {
  if (minutes === undefined || minutes === null || isNaN(minutes)) return '—';
  const m = Number(minutes);
  if (m < 60) return `${m} min${m === 1 ? '' : 's'}`;
  const hrs = Math.floor(m / 60);
  const remainingMins = m % 60;
  if (remainingMins === 0) return `${hrs} hr${hrs === 1 ? '' : 's'}`;
  return `${hrs} hr${hrs === 1 ? '' : 's'} ${remainingMins} min${remainingMins === 1 ? '' : 's'}`;
};

/**
 * Format remaining seconds into HH:MM:SS format for exam timer.
 * Example: 3665 -> '01:01:05', 125 -> '00:02:05'
 */
export const formatTimeRemaining = (seconds) => {
  if (seconds === undefined || seconds === null || seconds < 0 || isNaN(seconds)) {
    return '00:00:00';
  }
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
};

/**
 * Format percentage.
 * Example: 84.567 -> '84.6%'
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

