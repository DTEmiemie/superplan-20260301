// SuperMemo Plan - Elastic Schedule Engine
// Core algorithm for calculating optimal activity allocations

import type { Activity } from '@/types';

// Parse time string (HH:MM) to minutes from midnight
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes to time string (HH:MM)
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = Math.floor(minutes % 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Add minutes to time string
export function addMinutes(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes;
  return minutesToTime(totalMinutes);
}

// Calculate difference between two times in minutes
export function timeDifference(time1: string, time2: string): number {
  return timeToMinutes(time1) - timeToMinutes(time2);
}

export interface CalculationResult {
  activities: Activity[];
  totalAvailableTime: number;
  totalDesiredTime: number;
  compressionRatio: number;
}

/**
 * Calculate the elastic schedule
 * This is the core algorithm that:
 * 1. Calculates optimum schedule (without fixed activities)
 * 2. Applies fixed time constraints
 * 3. Compresses floating activities to fit available time
 */
export function calculateSchedule(
  activities: Activity[],
  scheduleStartTime: string,
  totalHours: number
): CalculationResult {
  if (activities.length === 0) {
    return {
      activities: [],
      totalAvailableTime: totalHours * 60,
      totalDesiredTime: 0,
      compressionRatio: 1,
    };
  }

  const totalAvailableMinutes = totalHours * 60;
  const scheduleStartMinutes = timeToMinutes(scheduleStartTime);
  const scheduleEndMinutes = scheduleStartMinutes + totalAvailableMinutes;

  // Step 1: Calculate optimum schedule (no fixed activities)
  let currentOptTime = scheduleStartMinutes;
  const activitiesWithOpt = activities.map((activity) => {
    const optStart = minutesToTime(currentOptTime);
    const optLen = activity.length;
    currentOptTime += optLen;
    return {
      ...activity,
      optStart,
      optLen,
    };
  });

  // Step 2: Calculate actual schedule with fixed activities
  let currentTime = scheduleStartMinutes;
  const calculatedActivities: Activity[] = [];

  for (let i = 0; i < activitiesWithOpt.length; i++) {
    const activity = activitiesWithOpt[i];
    
    // If activity has fixed start time, use it
    if (activity.isFixed && activity.start) {
      currentTime = timeToMinutes(activity.start);
    }

    const start = minutesToTime(currentTime);
    
    // Calculate available time until next fixed activity or end of schedule
    let availableTime = totalAvailableMinutes;
    const nextFixedIndex = activitiesWithOpt.findIndex(
      (a, idx) => idx > i && a.isFixed && a.start
    );
    
    if (nextFixedIndex !== -1) {
      const nextFixedStart = timeToMinutes(activitiesWithOpt[nextFixedIndex].start);
      availableTime = nextFixedStart - currentTime;
    } else {
      availableTime = scheduleEndMinutes - currentTime;
    }

    // Calculate time needed for remaining activities
    const remainingActivities = activitiesWithOpt.slice(i + 1);
    const remainingRigidTime = remainingActivities
      .filter((a) => a.isRigid)
      .reduce((sum, a) => sum + a.length, 0);
    
    // Calculate flexible time available
    const flexibleTime = Math.max(0, availableTime - remainingRigidTime);
    
    // Calculate actual length
    let actLen: number;
    if (activity.isRigid) {
      // Rigid activities keep their desired length
      actLen = Math.min(activity.length, availableTime);
    } else {
      // Flexible activities get compressed proportionally
      const remainingFlexible = [activity, ...remainingActivities.filter((a) => !a.isRigid)];
      const totalFlexibleDesired = remainingFlexible.reduce((sum, a) => sum + a.length, 0);
      
      if (totalFlexibleDesired > 0) {
        const ratio = flexibleTime / totalFlexibleDesired;
        actLen = Math.floor(activity.length * ratio);
      } else {
        actLen = 0;
      }
    }

    // Ensure we don't exceed available time
    actLen = Math.min(actLen, availableTime);
    actLen = Math.max(actLen, 0);

    // Calculate delay and shift
    const optStartMinutes = timeToMinutes(activity.optStart);
    const delay = currentTime - optStartMinutes;
    const optShift = optStartMinutes - currentTime;

    // Calculate percent of optimum
    const percent = activity.optLen > 0 ? Math.round((actLen / activity.optLen) * 100) : 100;

    calculatedActivities.push({
      ...activity,
      start,
      actLen,
      delay,
      optShift: -optShift,
      percent,
    });

    currentTime += actLen;
  }

  const totalDesiredTime = activities.reduce((sum, a) => sum + a.length, 0);
  const compressionRatio = totalDesiredTime > 0 ? totalAvailableMinutes / totalDesiredTime : 1;

  return {
    activities: calculatedActivities,
    totalAvailableTime: totalAvailableMinutes,
    totalDesiredTime,
    compressionRatio,
  };
}

/**
 * Recalculate schedule from a specific activity onwards
 * Used when beginning an activity (updating start time)
 */
export function recalculateFromActivity(
  activities: Activity[],
  fromIndex: number,
  newStartTime: string,
  totalHours: number
): Activity[] {
  const updatedActivities = [...activities];
  
  // Update the start time of the activity at fromIndex
  if (updatedActivities[fromIndex]) {
    updatedActivities[fromIndex] = {
      ...updatedActivities[fromIndex],
      start: newStartTime,
      isFixed: true, // Once started, activity becomes fixed
    };
  }

  // Recalculate the entire schedule
  const result = calculateSchedule(updatedActivities, activities[0]?.start || '00:00', totalHours);
  
  return result.activities;
}

/**
 * Mark an activity as started and recalculate schedule
 */
export function beginActivity(
  activities: Activity[],
  activityIndex: number,
  totalHours: number
): Activity[] {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const updatedActivities = activities.map((a, i) => ({
    ...a,
    isActive: i === activityIndex,
    isCompleted: i < activityIndex ? true : a.isCompleted,
  }));

  return recalculateFromActivity(updatedActivities, activityIndex, currentTime, totalHours);
}

/**
 * Get current active activity index
 */
export function getCurrentActivityIndex(activities: Activity[]): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  for (let i = 0; i < activities.length; i++) {
    const startMinutes = timeToMinutes(activities[i].start);
    const endMinutes = startMinutes + activities[i].actLen;
    
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return i;
    }
  }
  
  return -1;
}

/**
 * Calculate statistics for the schedule
 */
export function calculateStats(activities: Activity[]) {
  const completed = activities.filter((a) => a.isCompleted).length;
  const totalDelay = activities.reduce((sum, a) => sum + Math.max(0, a.delay), 0);
  const totalLoss = activities.reduce((sum, a) => sum + Math.max(0, a.length - a.actLen), 0);
  
  // Find delay offenders (activities causing most delay)
  const offenders = [...activities]
    .filter((a) => a.delay > 0)
    .sort((a, b) => b.delay - a.delay)
    .slice(0, 5);

  return {
    totalActivities: activities.length,
    completedActivities: completed,
    totalDelay,
    totalLoss,
    offenders,
  };
}

/**
 * Create a new empty activity
 */
export function createActivity(name: string = '', length: number = 30): Activity {
  return {
    id: crypto.randomUUID(),
    name,
    length,
    actLen: length,
    optLen: length,
    start: '00:00',
    optStart: '00:00',
    optShift: 0,
    delay: 0,
    percent: 100,
    isFixed: false,
    isRigid: false,
    isCompleted: false,
    isActive: false,
  };
}

/**
 * Create anchor activities for a new schedule
 * First activity = start anchor (default current time, not fixed)
 * Last activity = end anchor (calculated from total hours)
 */
export function createAnchorActivities(totalHours: number): Activity[] {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const totalMinutes = totalHours * 60;
  const endTime = addMinutes(currentTime, totalMinutes);

  return [
    {
      ...createActivity('Start', 0),
      start: currentTime,
      actLen: 0,
      optLen: 0,
      isFixed: false, // Start anchor is not fixed by default
    },
    {
      ...createActivity('End', 0),
      start: endTime,
      actLen: 0,
      optLen: 0,
      isFixed: true, // End anchor is always fixed
    },
  ];
}

/**
 * Update end anchor time when total hours changes
 * If start anchor is fixed, end time moves; otherwise start time moves
 */
export function updateAnchorActivities(
  activities: Activity[],
  totalHours: number
): Activity[] {
  if (activities.length < 2) return activities;

  const startAnchor = activities[0];
  const endAnchor = activities[activities.length - 1];
  const totalMinutes = totalHours * 60;

  const updatedActivities = [...activities];

  if (startAnchor.isFixed) {
    // Start is fixed, move end anchor
    const newEndTime = addMinutes(startAnchor.start, totalMinutes);
    updatedActivities[updatedActivities.length - 1] = {
      ...endAnchor,
      start: newEndTime,
    };
  } else {
    // Start is not fixed, we could adjust it based on end anchor
    // But typically we keep start at current time and adjust end
    const newEndTime = addMinutes(startAnchor.start, totalMinutes);
    updatedActivities[updatedActivities.length - 1] = {
      ...endAnchor,
      start: newEndTime,
    };
  }

  return updatedActivities;
}

/**
 * Insert an activity at a specific position
 * Activities before and after will be compressed/expanded
 */
export function insertActivity(
  activities: Activity[],
  index: number,
  activity?: Activity
): Activity[] {
  const newActivity = activity || createActivity('New Activity', 30);
  const updatedActivities = [...activities];
  updatedActivities.splice(index, 0, newActivity);
  return updatedActivities;
}

/**
 * Reorder activity with anchor inheritance logic
 * When moving to position 0 (before start): inherit start anchor's start time
 * When moving to last position (after end): use end anchor's start time
 * Otherwise: keep original start time and properties
 */
export function reorderActivity(
  activities: Activity[],
  fromIndex: number,
  toIndex: number
): Activity[] {
  if (fromIndex === toIndex) return activities;
  if (fromIndex < 0 || fromIndex >= activities.length) return activities;
  if (toIndex < 0 || toIndex > activities.length) return activities;

  const updatedActivities = [...activities];
  const [movedActivity] = updatedActivities.splice(fromIndex, 1);
  
  // Insert at new position
  updatedActivities.splice(toIndex, 0, movedActivity);

  // Handle anchor inheritance
  const startAnchor = updatedActivities[0];
  const endAnchor = updatedActivities[updatedActivities.length - 1];

  // If moved to position 0 (before start anchor), inherit start time
  if (toIndex === 0) {
    updatedActivities[0] = {
      ...movedActivity,
      start: startAnchor.start, // Inherit start anchor's time
      isFixed: false, // Not fixed by default
    };
    // The original start anchor becomes position 1
    // Its start time will be recalculated by calculateSchedule
  }
  // If moved to last position (after end anchor), use end anchor's time
  else if (toIndex === updatedActivities.length - 1) {
    updatedActivities[toIndex] = {
      ...movedActivity,
      start: endAnchor.start, // Use end anchor's time
      isFixed: false,
    };
  }

  return updatedActivities;
}

/**
 * Adjust schedule - copy ActLen to Length (make current actual the new desired)
 */
export function adjustSchedule(activities: Activity[]): Activity[] {
  return activities.map((a) => ({
    ...a,
    length: a.actLen,
    delay: 0,
    percent: 100,
  }));
}

/**
 * Check if a user-edited start time should mark activity as fixed (F)
 * In SuperMemo, manually setting a start time marks it as fixed
 */
export function shouldMarkAsFixed(
  _activity: Activity,
  newStartTime: string,
  originalStartTime: string
): boolean {
  // If start time is changed by user, mark as fixed
  return newStartTime !== originalStartTime;
}
