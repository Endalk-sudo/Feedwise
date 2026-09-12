import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

import { toast } from 'sonner';
import { useUIStore } from './stores/ui.store';
import { startToastBridge } from './toast-bridge';

describe('toast bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState({ toasts: [] });
  });

  it('forwards addToast entries to sonner exactly once', async () => {
    startToastBridge();
    useUIStore.getState().addToast({ message: 'Saved!', type: 'success' });

    await vi.waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        'Saved!',
        expect.objectContaining({ duration: 4000 }),
      );
    });
    expect(useUIStore.getState().toasts).toHaveLength(0);
  });

  it('maps error toasts with a longer duration', async () => {
    startToastBridge();
    useUIStore.getState().addToast({ message: 'Boom', type: 'error' });

    await vi.waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'Boom',
        expect.objectContaining({ duration: 6000 }),
      );
    });
  });
});
