// Local storage hook for schedules - auto-save version

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Schedule, AppSettings } from '@/types';
import { createAnchorActivities, addMinutes } from '@/lib/scheduleEngine';
import { generateId } from '@/lib/utils';

const SCHEDULES_KEY = 'supermemo-plan-schedules';
const SETTINGS_KEY = 'supermemo-plan-settings';
const CURRENT_SCHEDULE_KEY = 'supermemo-plan-current';

const defaultSettings: AppSettings = {
  notifications: {
    enabled: true,
    minutesBefore: 2,
    soundEnabled: true,
  },
  defaultScheduleHours: 16,
  defaultStartTime: '07:00',
  autoAlarm: true,
};

export function useScheduleStorage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedSchedules = localStorage.getItem(SCHEDULES_KEY);
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      const savedCurrent = localStorage.getItem(CURRENT_SCHEDULE_KEY);

      if (savedSchedules) {
        setSchedules(JSON.parse(savedSchedules));
      }
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          notifications: { ...prev.notifications, ...(parsed.notifications || {}) },
        }));
      }
      if (savedCurrent) {
        setCurrentScheduleId(savedCurrent);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Auto-save schedules to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
      } catch (error) {
        console.error('Error saving schedules:', error);
      }
    }
  }, [schedules, isLoaded]);

  // Auto-save settings
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  }, [settings, isLoaded]);

  // Auto-save current schedule ID
  useEffect(() => {
    if (isLoaded) {
      try {
        if (currentScheduleId) {
          localStorage.setItem(CURRENT_SCHEDULE_KEY, currentScheduleId);
        } else {
          localStorage.removeItem(CURRENT_SCHEDULE_KEY);
        }
      } catch (error) {
        console.error('Error saving current schedule:', error);
      }
    }
  }, [currentScheduleId, isLoaded]);

  // Auto-heal: if currentScheduleId is invalid, select the first schedule
  useEffect(() => {
    if (!isLoaded) return;
    if (schedules.length === 0) {
      if (currentScheduleId !== null) setCurrentScheduleId(null);
      return;
    }
    if (!schedules.some((s) => s.id === currentScheduleId)) {
      setCurrentScheduleId(schedules[0].id);
    }
  }, [isLoaded, schedules, currentScheduleId]);

  // Derive current schedule from schedules array (single source of truth)
  const currentSchedule = useMemo(() => {
    if (!currentScheduleId) return null;
    return schedules.find((s) => s.id === currentScheduleId) ?? null;
  }, [schedules, currentScheduleId]);

  // Update the current schedule in-place (auto-saves via schedules effect)
  const updateCurrentSchedule = useCallback(
    (updater: (prev: Schedule) => Schedule) => {
      setSchedules((prev) => {
        const idx = prev.findIndex((s) => s.id === currentScheduleId);
        if (idx < 0) return prev;
        const updated = [...prev];
        updated[idx] = { ...updater(prev[idx]), updatedAt: Date.now() };
        return updated;
      });
    },
    [currentScheduleId]
  );

  // Create new schedule with unique name
  const createNewSchedule = useCallback(
    (baseName?: string): Schedule => {
      const date = new Date().toISOString().split('T')[0];
      const name = baseName ?? generateScheduleName(schedules, date);
      const newSchedule: Schedule = {
        id: generateId(),
        name,
        date,
        totalHours: settings.defaultScheduleHours,
        startTime: settings.defaultStartTime,
        activities: createAnchorActivities(settings.defaultStartTime, settings.defaultScheduleHours),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSchedules((prev) => [...prev, newSchedule]);
      setCurrentScheduleId(newSchedule.id);
      return newSchedule;
    },
    [settings, schedules]
  );

  // Delete schedule and auto-select next one
  const deleteSchedule = useCallback(
    (id: string) => {
      const currentIdx = schedules.findIndex((s) => s.id === id);
      const remaining = schedules.filter((s) => s.id !== id);

      setSchedules(remaining);

      if (currentScheduleId === id) {
        const nextSchedule =
          remaining[currentIdx] ?? remaining[currentIdx - 1] ?? remaining[0] ?? null;
        setCurrentScheduleId(nextSchedule?.id ?? null);
      }
    },
    [currentScheduleId, schedules]
  );

  const switchSchedule = useCallback(
    (id: string) => {
      const exists = schedules.some((s) => s.id === id);
      if (exists) {
        setCurrentScheduleId(id);
      }
    },
    [schedules]
  );

  const duplicateSchedule = useCallback(
    (scheduleId: string, newDate: string): Schedule | null => {
      const original = schedules.find((s) => s.id === scheduleId);
      if (!original) return null;

      const duplicated: Schedule = {
        ...original,
        id: generateId(),
        name: `${original.name} (copy)`,
        date: newDate,
        activities: original.activities.map((a, i) => ({
          ...a,
          id: generateId(),
          isCompleted: false,
          isActive: false,
          isFixed: i === original.activities.length - 1,
          start:
            i === 0
              ? original.startTime
              : i === original.activities.length - 1
                ? addMinutes(original.startTime, original.totalHours * 60)
                : '00:00',
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setSchedules((prev) => [...prev, duplicated]);
      setCurrentScheduleId(duplicated.id);
      return duplicated;
    },
    [schedules]
  );

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      notifications: {
        ...prev.notifications,
        ...(newSettings.notifications || {}),
      },
    }));
  }, []);

  return {
    schedules,
    settings,
    currentSchedule,
    currentScheduleId,
    isLoaded,
    createNewSchedule,
    deleteSchedule,
    switchSchedule,
    duplicateSchedule,
    updateCurrentSchedule,
    updateSettings,
    setCurrentScheduleId,
  };
}

// Generate a unique schedule name like "Plan 03-02", "Plan 03-02 (2)"
function generateScheduleName(schedules: Schedule[], date: string): string {
  const shortDate = date.slice(5); // "03-02"
  const baseName = `Plan ${shortDate}`;
  const existingNames = new Set(schedules.map((s) => s.name));

  if (!existingNames.has(baseName)) return baseName;

  let counter = 2;
  while (existingNames.has(`${baseName} (${counter})`)) {
    counter++;
  }
  return `${baseName} (${counter})`;
}
