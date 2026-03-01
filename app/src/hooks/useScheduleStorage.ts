// Local storage hook for schedules

import { useState, useEffect, useCallback } from 'react';
import type { Schedule, AppSettings } from '@/types';
import { createAnchorActivities } from '@/lib/scheduleEngine';
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
        // Merge with defaults to handle missing fields from older versions
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          notifications: { ...prev.notifications, ...parsed.notifications },
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

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
      } catch (error) {
        console.error('Error saving schedules:', error);
      }
    }
  }, [schedules, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  }, [settings, isLoaded]);

  useEffect(() => {
    if (isLoaded && currentScheduleId) {
      try {
        localStorage.setItem(CURRENT_SCHEDULE_KEY, currentScheduleId);
      } catch (error) {
        console.error('Error saving current schedule:', error);
      }
    }
  }, [currentScheduleId, isLoaded]);

  const saveSchedule = useCallback((schedule: Schedule) => {
    setSchedules((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === schedule.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...schedule, updatedAt: Date.now() };
        return updated;
      }
      return [...prev, { ...schedule, updatedAt: Date.now() }];
    });
    setCurrentScheduleId(schedule.id);
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    if (currentScheduleId === id) {
      setCurrentScheduleId(null);
    }
  }, [currentScheduleId]);

  const getSchedule = useCallback(
    (id: string): Schedule | undefined => {
      return schedules.find((s) => s.id === id);
    },
    [schedules]
  );

  const getCurrentSchedule = useCallback((): Schedule | undefined => {
    if (!currentScheduleId) return undefined;
    return schedules.find((s) => s.id === currentScheduleId);
  }, [currentScheduleId, schedules]);

  const createNewSchedule = useCallback(
    (name: string, date: string = new Date().toISOString().split('T')[0]): Schedule => {
      const newSchedule: Schedule = {
        id: generateId(),
        name,
        date,
        totalHours: settings.defaultScheduleHours,
        startTime: settings.defaultStartTime,
        activities: createAnchorActivities(settings.defaultScheduleHours),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSchedules((prev) => [...prev, newSchedule]);
      setCurrentScheduleId(newSchedule.id);
      return newSchedule;
    },
    [settings]
  );

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const duplicateSchedule = useCallback(
    (scheduleId: string, newDate: string): Schedule | null => {
      const original = getSchedule(scheduleId);
      if (!original) return null;

      const duplicated: Schedule = {
        ...original,
        id: generateId(),
        date: newDate,
        activities: original.activities.map((a) => ({
          ...a,
          id: generateId(),
          isCompleted: false,
          isActive: false,
          start: '00:00',
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setSchedules((prev) => [...prev, duplicated]);
      setCurrentScheduleId(duplicated.id);
      return duplicated;
    },
    [getSchedule]
  );

  return {
    schedules,
    settings,
    currentScheduleId,
    isLoaded,
    saveSchedule,
    deleteSchedule,
    getSchedule,
    getCurrentSchedule,
    createNewSchedule,
    updateSettings,
    duplicateSchedule,
    setCurrentScheduleId,
  };
}
