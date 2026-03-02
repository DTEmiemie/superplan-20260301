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

type ScheduleStore = {
  schedules: Schedule[];
  currentScheduleId: string | null;
};

function normalizeStore(store: ScheduleStore): ScheduleStore {
  if (store.schedules.length === 0) {
    return { schedules: [], currentScheduleId: null };
  }
  if (!store.currentScheduleId) {
    return { ...store, currentScheduleId: store.schedules[0].id };
  }
  if (!store.schedules.some((s) => s.id === store.currentScheduleId)) {
    return { ...store, currentScheduleId: store.schedules[0].id };
  }
  return store;
}

export function useScheduleStorage() {
  const [store, setStore] = useState<ScheduleStore>({ schedules: [], currentScheduleId: null });
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    let savedSchedules: Schedule[] = [];
    let savedCurrentId: string | null = null;
    try {
      const schedulesRaw = localStorage.getItem(SCHEDULES_KEY);
      const settingsRaw = localStorage.getItem(SETTINGS_KEY);
      const currentRaw = localStorage.getItem(CURRENT_SCHEDULE_KEY);

      if (schedulesRaw) {
        savedSchedules = JSON.parse(schedulesRaw);
      }
      if (settingsRaw) {
        const parsed = JSON.parse(settingsRaw);
        setSettings(() => ({
          ...defaultSettings,
          ...parsed,
          notifications: { ...defaultSettings.notifications, ...(parsed.notifications || {}) },
        }));
      }
      if (currentRaw) {
        savedCurrentId = currentRaw;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    setStore(normalizeStore({ schedules: savedSchedules, currentScheduleId: savedCurrentId }));
    setIsLoaded(true);
  }, []);

  // Auto-save schedules to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SCHEDULES_KEY, JSON.stringify(store.schedules));
      } catch (error) {
        console.error('Error saving schedules:', error);
      }
    }
  }, [store.schedules, isLoaded]);

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
        if (store.currentScheduleId) {
          localStorage.setItem(CURRENT_SCHEDULE_KEY, store.currentScheduleId);
        } else {
          localStorage.removeItem(CURRENT_SCHEDULE_KEY);
        }
      } catch (error) {
        console.error('Error saving current schedule:', error);
      }
    }
  }, [store.currentScheduleId, isLoaded]);

  // Derive current schedule from schedules array (single source of truth)
  const currentSchedule = useMemo(() => {
    if (!store.currentScheduleId) return null;
    return store.schedules.find((s) => s.id === store.currentScheduleId) ?? null;
  }, [store.schedules, store.currentScheduleId]);

  // Update the current schedule in-place (auto-saves via schedules effect)
  const updateCurrentSchedule = useCallback(
    (updater: (prev: Schedule) => Schedule) => {
      setStore((prev) => {
        if (!prev.currentScheduleId) return prev;
        const idx = prev.schedules.findIndex((s) => s.id === prev.currentScheduleId);
        if (idx < 0) return normalizeStore(prev);
        const updatedSchedules = [...prev.schedules];
        updatedSchedules[idx] = { ...updater(prev.schedules[idx]), updatedAt: Date.now() };
        return { ...prev, schedules: updatedSchedules };
      });
    },
    []
  );

  // Create new schedule with unique name
  const createNewSchedule = useCallback(
    (baseName?: string): Schedule => {
      const date = new Date().toISOString().split('T')[0];
      const now = Date.now();
      let createdSchedule: Schedule | null = null;

      setStore((prev) => {
        const name = baseName ?? generateScheduleName(prev.schedules, date);
        createdSchedule = {
          id: generateId(),
          name,
          date,
          totalHours: settings.defaultScheduleHours,
          startTime: settings.defaultStartTime,
          activities: createAnchorActivities(
            settings.defaultStartTime,
            settings.defaultScheduleHours
          ),
          createdAt: now,
          updatedAt: now,
        };

        const updatedStore: ScheduleStore = {
          schedules: [...prev.schedules, createdSchedule],
          currentScheduleId: createdSchedule.id,
        };
        return normalizeStore(updatedStore);
      });

      return createdSchedule!;
    },
    [settings.defaultScheduleHours, settings.defaultStartTime]
  );

  // Delete schedule and auto-select next one
  const deleteSchedule = useCallback(
    (id: string) => {
      setStore((prev) => {
        const currentIdx = prev.schedules.findIndex((s) => s.id === id);
        if (currentIdx < 0) return prev;

        const remaining = prev.schedules.filter((s) => s.id !== id);
        let nextId = prev.currentScheduleId;

        if (prev.currentScheduleId === id) {
          const nextSchedule =
            remaining[currentIdx] ?? remaining[currentIdx - 1] ?? remaining[0] ?? null;
          nextId = nextSchedule?.id ?? null;
        }

        return normalizeStore({ schedules: remaining, currentScheduleId: nextId });
      });
    },
    []
  );

  const switchSchedule = useCallback(
    (id: string) => {
      setStore((prev) => {
        if (!prev.schedules.some((s) => s.id === id)) return prev;
        return normalizeStore({ ...prev, currentScheduleId: id });
      });
    },
    []
  );

  const duplicateSchedule = useCallback(
    (scheduleId: string, newDate: string): Schedule | null => {
      let duplicated: Schedule | null = null;
      const now = Date.now();

      setStore((prev) => {
        const original = prev.schedules.find((s) => s.id === scheduleId);
        if (!original) return prev;

        duplicated = {
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
          createdAt: now,
          updatedAt: now,
        };

        return normalizeStore({
          schedules: [...prev.schedules, duplicated],
          currentScheduleId: duplicated.id,
        });
      });

      return duplicated;
    },
    []
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
    schedules: store.schedules,
    settings,
    currentSchedule,
    currentScheduleId: store.currentScheduleId,
    isLoaded,
    createNewSchedule,
    deleteSchedule,
    switchSchedule,
    duplicateSchedule,
    updateCurrentSchedule,
    updateSettings,
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
