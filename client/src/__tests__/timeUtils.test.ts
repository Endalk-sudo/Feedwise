import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTimeAgo, sortFeedbackByTime } from '../utils/timeUtils';

describe('timeUtils', () => {
  describe('formatTimeAgo', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Just now" for less than 1 minute ago', () => {
      const now = new Date('2026-09-03T12:00:00Z');
      vi.setSystemTime(now);

      const date = new Date('2026-09-03T11:59:30Z');
      expect(formatTimeAgo(date.toISOString())).toBe('Just now');
    });

    it('should return minutes ago for less than 1 hour', () => {
      const now = new Date('2026-09-03T12:00:00Z');
      vi.setSystemTime(now);

      const date = new Date('2026-09-03T11:45:00Z');
      expect(formatTimeAgo(date.toISOString())).toBe('15m ago');
    });

    it('should return hours ago for less than 24 hours', () => {
      const now = new Date('2026-09-03T12:00:00Z');
      vi.setSystemTime(now);

      const date = new Date('2026-09-03T09:00:00Z');
      expect(formatTimeAgo(date.toISOString())).toBe('3h ago');
    });

    it('should return days ago for less than 7 days', () => {
      const now = new Date('2026-09-03T12:00:00Z');
      vi.setSystemTime(now);

      const date = new Date('2026-09-01T12:00:00Z');
      expect(formatTimeAgo(date.toISOString())).toBe('2d ago');
    });

    it('should return formatted date for 7+ days', () => {
      const now = new Date('2026-09-03T12:00:00Z');
      vi.setSystemTime(now);

      const date = new Date('2026-08-20T12:00:00Z');
      const result = formatTimeAgo(date.toISOString());
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('sortFeedbackByTime', () => {
    it('should sort feedback by most recent first', () => {
      const feedbacks = [
        { _id: '1', createdAt: '2026-09-01T10:00:00Z', text: 'Old' },
        { _id: '2', createdAt: '2026-09-03T10:00:00Z', text: 'New' },
        { _id: '3', createdAt: '2026-09-02T10:00:00Z', text: 'Middle' },
      ];

      const sorted = sortFeedbackByTime(feedbacks);

      expect(sorted[0].text).toBe('New');
      expect(sorted[1].text).toBe('Middle');
      expect(sorted[2].text).toBe('Old');
    });

    it('should not mutate the original array', () => {
      const feedbacks = [
        { _id: '1', createdAt: '2026-09-01T10:00:00Z', text: 'Old' },
        { _id: '2', createdAt: '2026-09-03T10:00:00Z', text: 'New' },
      ];

      const sorted = sortFeedbackByTime(feedbacks);

      expect(sorted).not.toBe(feedbacks);
      expect(feedbacks[0].text).toBe('Old');
    });
  });
});
