// SuperMemo Plan Types

export interface Activity {
  id: string;
  name: string;
  length: number; // Desired length in minutes
  actLen: number; // Actual allocated length in minutes
  optLen: number; // Optimum length without fixed activities
  start: string; // Actual start time (HH:MM)
  optStart: string; // Optimum start time (HH:MM)
  optShift: number; // Difference between optStart and start in minutes
  delay: number; // Delay in minutes (Start - OptStart)
  percent: number; // Percentage of optimum time used
  isFixed: boolean; // Fixed time activity (F)
  isRigid: boolean; // Rigid activity (R) - won't be compressed
  isCompleted: boolean;
  isActive: boolean;
}

export interface Schedule {
  id: string;
  name: string;
  date: string;
  totalHours: number; // Total schedule length in hours
  startTime: string; // Schedule start time (HH:MM)
  activities: Activity[];
  createdAt: number;
  updatedAt: number;
}

export interface ScheduleStats {
  totalActivities: number;
  completedActivities: number;
  totalDelay: number; // Total delay in minutes
  totalLoss: number; // Total time lost from shortened activities
  offenders: Activity[]; // Activities causing most delay
}

export interface NotificationSettings {
  enabled: boolean;
  minutesBefore: number;
  soundEnabled: boolean;
  soundUrl?: string;
}

export interface AppSettings {
  notifications: NotificationSettings;
  defaultScheduleHours: number;
  defaultStartTime: string;
  autoAlarm: boolean;
}

// Utility type for time calculations
export interface TimeCalculation {
  startMinutes: number;
  endMinutes: number;
  duration: number;
}
