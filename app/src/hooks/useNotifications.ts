// Notification system for schedule alarms

import { useEffect, useRef, useCallback } from 'react';
import type { Activity, AppSettings } from '@/types';
import { timeToMinutes } from '@/lib/scheduleEngine';

export function useNotifications(
  activities: Activity[],
  settings: AppSettings,
  onAlarm?: (activity: Activity) => void
) {
  const alarmTimeoutsRef = useRef<Map<string, number>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    if (settings.notifications.soundEnabled) {
      audioRef.current = new Audio(
        settings.notifications.soundUrl || '/default-alarm.mp3'
      );
    }
    return () => {
      audioRef.current = null;
    };
  }, [settings.notifications.soundEnabled, settings.notifications.soundUrl]);

  // Clear all alarms
  const clearAllAlarms = useCallback(() => {
    alarmTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    alarmTimeoutsRef.current.clear();
  }, []);

  // Play alarm sound
  const playAlarm = useCallback(() => {
    if (audioRef.current && settings.notifications.soundEnabled) {
      audioRef.current.play().catch((error) => {
        console.error('Error playing alarm:', error);
      });
    }
  }, [settings.notifications.soundEnabled]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Show notification
  const showNotification = useCallback(
    (activity: Activity) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('SuperMemo Plan', {
          body: `Activity "${activity.name}" is ending in ${settings.notifications.minutesBefore} minutes!`,
          icon: '/favicon.ico',
        });
      }
      playAlarm();
      onAlarm?.(activity);
    },
    [settings.notifications.minutesBefore, playAlarm, onAlarm]
  );

  // Set up alarms for active and upcoming activities
  useEffect(() => {
    if (!settings.notifications.enabled) {
      clearAllAlarms();
      return;
    }

    // Request permission if needed
    if ('Notification' in window && Notification.permission === 'default') {
      requestPermission();
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find active activity
    const activeActivity = activities.find((a) => a.isActive);

    if (activeActivity) {
      const startMinutes = timeToMinutes(activeActivity.start);
      const endMinutes = startMinutes + activeActivity.actLen;
      const alarmMinutes = endMinutes - settings.notifications.minutesBefore;

      // Calculate precise delay using millisecond timestamps
      const alarmTime = todayStart.getTime() + alarmMinutes * 60 * 1000;
      const delayMs = alarmTime - now.getTime();

      // Only set alarm if it's in the future
      if (delayMs > 0) {
        
        const timeout = window.setTimeout(() => {
          showNotification(activeActivity);
        }, delayMs);

        alarmTimeoutsRef.current.set(activeActivity.id, timeout);
      }
    }

    return () => {
      clearAllAlarms();
    };
  }, [activities, settings.notifications, showNotification, clearAllAlarms, requestPermission]);

  // Manual alarm trigger for testing
  const triggerAlarm = useCallback(
    (activity: Activity) => {
      showNotification(activity);
    },
    [showNotification]
  );

  return {
    requestPermission,
    triggerAlarm,
    clearAllAlarms,
  };
}

// Hook for periodic notifications (reminders)
export function usePeriodicReminders(
  enabled: boolean,
  intervalMinutes: number = 30,
  message?: string
) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Request permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    intervalRef.current = window.setInterval(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('SuperMemo Plan Reminder', {
          body: message || 'Check your schedule!',
          icon: '/favicon.ico',
        });
      }
    }, intervalMinutes * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMinutes, message]);
}
