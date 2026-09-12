import { toast } from 'sonner';
import { useUIStore } from './stores/ui.store';

const DURATION: Record<string, number> = {
  success: 4000,
  error: 6000,
  info: 4000,
  warning: 5000,
};

/**
 * One-time bridge: forwards `addToast()` store entries to sonner's
 * `<Toaster/>` and removes them from the store so each fires exactly once.
 * Call once at app startup (main.tsx). Safe to call multiple times.
 */
let started = false;

export function startToastBridge(): () => void {
  if (started) return () => {};
  started = true;

  return useUIStore.subscribe((state, prev) => {
    const seen = new Set(prev.toasts.map((t) => t.id));
    for (const t of state.toasts) {
      if (seen.has(t.id)) continue;
      const show = toast[t.type] ?? toast;
      show(t.message, { duration: t.duration ?? DURATION[t.type] ?? 4000 });
      // Defer removal so the subscriber loop isn't re-entered mid-iteration.
      queueMicrotask(() => useUIStore.getState().removeToast(t.id));
    }
  });
}
