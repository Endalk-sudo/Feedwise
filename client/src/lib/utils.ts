import { clsx, type ClassValue } from 'clsx';
import { isAxiosError } from 'axios';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge class names
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to relative time (e.g., "2h ago", "3 days ago")
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/** Alias for semantic clarity in feedback lists. */
export const formatRelativeTime = formatTimeAgo;

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
/**
 * Pull the human-readable message out of a failed API call.
 *
 * The server always answers errors with `{ success: false, message: string }`
 * (axios puts it at `error.response.data.message`). Falls back to the axios
 * error text, then the given fallback — so error cards can show "Forbidden"
 * instead of a generic "check your connection".
 */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
