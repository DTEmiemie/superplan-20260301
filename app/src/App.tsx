// SuperMemo Plan - Main Application - Mobile Optimized

import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster, toast } from 'sonner';
import { ActivityTable } from '@/components/ActivityTable';
import { StatsPanel } from '@/components/StatsPanel';
import { ScheduleToolbar } from '@/components/ScheduleToolbar';
import { NotificationSettingsPanel } from '@/components/NotificationSettings';
import { CurrentTimeIndicator } from '@/components/CurrentTimeIndicator';
import { useScheduleStorage } from '@/hooks/useScheduleStorage';
import { useNotifications, usePeriodicReminders } from '@/hooks/useNotifications';
import {
  calculateSchedule,
  createActivity,
  beginActivity,
  adjustSchedule,
  insertActivity,
  updateAnchorActivities,
  reorderActivity,
} from '@/lib/scheduleEngine';
import type { Schedule } from '@/types';
import { BarChart3, List, Settings, Clock } from 'lucide-react';

function App() {
  // Storage hooks
  const {
    schedules,
    settings,
    isLoaded,
    saveSchedule,
    deleteSchedule,
    getSchedule,
    getCurrentSchedule,
    createNewSchedule,
    updateSettings,
    duplicateSchedule,
    setCurrentScheduleId,
  } = useScheduleStorage();

  // Local state
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [calculatedActivities, setCalculatedActivities] = useState<Schedule['activities']>([]);

  // Initialize current schedule from storage
  useEffect(() => {
    if (isLoaded) {
      const saved = getCurrentSchedule();
      if (saved) {
        setCurrentSchedule(saved);
      }
    }
  }, [isLoaded, getCurrentSchedule]);

  // Recalculate schedule when activities change
  useEffect(() => {
    if (currentSchedule) {
      const result = calculateSchedule(
        currentSchedule.activities,
        currentSchedule.startTime,
        currentSchedule.totalHours
      );
      setCalculatedActivities(result.activities);
    } else {
      setCalculatedActivities([]);
    }
  }, [currentSchedule]);

  // Notifications
  const { requestPermission } = useNotifications(
    calculatedActivities,
    settings,
    (activity) => {
      toast.info(`Activity "${activity.name}" is ending soon!`, {
        action: {
          label: 'Dismiss',
          onClick: () => {},
        },
      });
    }
  );

  // Periodic reminders
  usePeriodicReminders(
    settings.notifications.enabled,
    30,
    'Check your schedule progress!'
  );

  // Schedule operations
  const handleNewSchedule = useCallback(() => {
    const date = new Date().toISOString().split('T')[0];
    const newSchedule = createNewSchedule(`Schedule ${date}`, date);
    setCurrentSchedule(newSchedule);
    toast.success('New schedule created with Start/End anchors');
  }, [createNewSchedule]);

  const handleSaveSchedule = useCallback(() => {
    if (currentSchedule) {
      saveSchedule(currentSchedule);
      toast.success('Schedule saved');
    }
  }, [currentSchedule, saveSchedule]);

  const handleLoadSchedule = useCallback(
    (id: string) => {
      const schedule = getSchedule(id);
      if (schedule) {
        setCurrentSchedule(schedule);
        setCurrentScheduleId(id);
        toast.success(`Loaded: ${schedule.name}`);
      }
    },
    [getSchedule, setCurrentScheduleId]
  );

  const handleDuplicateSchedule = useCallback(() => {
    if (currentSchedule) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const newDate = tomorrow.toISOString().split('T')[0];
      
      const duplicated = duplicateSchedule(currentSchedule.id, newDate);
      if (duplicated) {
        setCurrentSchedule(duplicated);
        toast.success('Schedule duplicated for tomorrow');
      }
    }
  }, [currentSchedule, duplicateSchedule]);

  const handleDeleteSchedule = useCallback(() => {
    if (currentSchedule) {
      deleteSchedule(currentSchedule.id);
      setCurrentSchedule(null);
      toast.success('Schedule deleted');
    }
  }, [currentSchedule, deleteSchedule]);

  const handleUpdateSchedule = useCallback((updates: Partial<Schedule>) => {
    setCurrentSchedule((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  // Handle total hours change - updates end anchor
  const handleTotalHoursChange = useCallback((hours: number) => {
    setCurrentSchedule((prev) => {
      if (!prev) return null;
      
      // Update total hours
      const updatedSchedule = { ...prev, totalHours: hours };
      
      // Update anchor activities
      const updatedActivities = updateAnchorActivities(prev.activities, hours);
      
      return { ...updatedSchedule, activities: updatedActivities };
    });
  }, []);

  // Activity operations
  const handleAddActivity = useCallback(() => {
    setCurrentSchedule((prev) => {
      if (!prev) return null;
      // Insert before the last activity (end anchor)
      const insertIndex = prev.activities.length - 1;
      const updatedActivities = insertActivity(prev.activities, insertIndex);
      return { ...prev, activities: updatedActivities };
    });
    toast.success('Activity added');
  }, []);

  const handleInsertActivity = useCallback((index: number) => {
    setCurrentSchedule((prev) => {
      if (!prev) return null;
      const updatedActivities = insertActivity(prev.activities, index);
      return { ...prev, activities: updatedActivities };
    });
    toast.success('Activity inserted');
  }, []);

  const handleUpdateActivity = useCallback(
    (index: number, updates: Partial<Schedule['activities'][0]>) => {
      setCurrentSchedule((prev) => {
        if (!prev) return null;
        const updatedActivities = [...prev.activities];
        updatedActivities[index] = { ...updatedActivities[index], ...updates };
        return { ...prev, activities: updatedActivities };
      });
    },
    []
  );

  const handleBeginActivity = useCallback(
    (index: number) => {
      if (!currentSchedule) return;

      const updatedActivities = beginActivity(
        currentSchedule.activities,
        index,
        currentSchedule.totalHours
      );

      setCurrentSchedule((prev) => {
        if (!prev) return null;
        return { ...prev, activities: updatedActivities };
      });

      const activity = updatedActivities[index];
      toast.success(`Started: ${activity.name}`, {
        description: `Allocated ${activity.actLen} minutes`,
      });

      // Request notification permission if needed
      if (settings.notifications.enabled) {
        requestPermission();
      }
    },
    [currentSchedule, settings.notifications.enabled, requestPermission]
  );

  const handleToggleFixed = useCallback((index: number) => {
    setCurrentSchedule((prev) => {
      if (!prev) return null;
      const updatedActivities = [...prev.activities];
      const activity = updatedActivities[index];
      
      // If it's the last activity (End anchor), always keep it fixed
      if (index === prev.activities.length - 1) {
        toast.info('End anchor must remain fixed');
        return prev;
      }
      
      updatedActivities[index] = {
        ...activity,
        isFixed: !activity.isFixed,
      };
      return { ...prev, activities: updatedActivities };
    });
  }, []);

  const handleToggleRigid = useCallback((index: number) => {
    setCurrentSchedule((prev) => {
      if (!prev) return null;
      const updatedActivities = [...prev.activities];
      updatedActivities[index] = {
        ...updatedActivities[index],
        isRigid: !updatedActivities[index].isRigid,
      };
      return { ...prev, activities: updatedActivities };
    });
  }, []);

  const handleReorderActivities = useCallback((fromIndex: number, toIndex: number) => {
    setCurrentSchedule((prev) => {
      if (!prev) return null;
      
      // Allow reordering to any position, including before start and after end
      // The reorderActivity function handles anchor inheritance
      const updatedActivities = reorderActivity(prev.activities, fromIndex, toIndex);
      return { ...prev, activities: updatedActivities };
    });
  }, []);

  const handleDeleteActivity = useCallback((index: number) => {
    setCurrentSchedule((prev) => {
      if (!prev) return null;
      
      // Prevent deleting if only 2 activities left (must keep anchors)
      if (prev.activities.length <= 2) {
        toast.error('Cannot delete - must keep Start/End anchors');
        return prev;
      }
      
      const activities = [...prev.activities];
      activities.splice(index, 1);
      return { ...prev, activities };
    });
    toast.success('Activity deleted');
  }, []);

  const handleSplitActivity = useCallback((index: number) => {
    setCurrentSchedule((prev) => {
      if (!prev) return null;
      const activities = [...prev.activities];
      const activity = activities[index];
      const halfLength = Math.floor(activity.length / 2);
      
      activities[index] = { ...activity, length: halfLength };
      activities.splice(index + 1, 0, {
        ...createActivity(`${activity.name} (part 2)`, halfLength),
      });
      
      return { ...prev, activities };
    });
  }, []);

  const handleAdjustSchedule = useCallback(() => {
    setCurrentSchedule((prev) => {
      if (!prev) return null;
      return { ...prev, activities: adjustSchedule(prev.activities) };
    });
    toast.success('Schedule adjusted - ActLen copied to Length');
  }, []);

  const handleResetSchedule = useCallback(() => {
    setCurrentSchedule((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        activities: prev.activities.map((a, i) => ({
          ...a,
          isCompleted: false,
          isActive: false,
          isFixed: i === prev.activities.length - 1, // Keep end anchor fixed
        })),
      };
    });
    toast.success('Schedule reset');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveSchedule();
      }
      // Ctrl/Cmd + N - New
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewSchedule();
      }
      // Ctrl/Cmd + Enter - Add activity
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAddActivity();
      }
      // Ins - Insert activity (like SuperMemo)
      if (e.key === 'Insert') {
        e.preventDefault();
        handleAddActivity();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveSchedule, handleNewSchedule, handleAddActivity]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      {/* Header - Mobile Optimized */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">SuperMemo Plan</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Elastic Schedule Management
              </p>
            </div>
            <div className="sm:w-auto w-full">
              <CurrentTimeIndicator />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="schedule" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-10 sm:h-11">
            <TabsTrigger value="schedule" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Schedule</span>
              <span className="sm:hidden">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Stats</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-3 sm:space-y-4">
            <ScheduleToolbar
              schedules={schedules}
              currentSchedule={currentSchedule}
              onNewSchedule={handleNewSchedule}
              onSaveSchedule={handleSaveSchedule}
              onLoadSchedule={handleLoadSchedule}
              onDuplicateSchedule={handleDuplicateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onAdjustSchedule={handleAdjustSchedule}
              onResetSchedule={handleResetSchedule}
              onShowStats={() => {}}
              onUpdateSchedule={handleUpdateSchedule}
              onAddActivity={handleAddActivity}
              onTotalHoursChange={handleTotalHoursChange}
            />

            {currentSchedule ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Schedule Info - Hidden (now in toolbar) */}

                <ActivityTable
                  activities={calculatedActivities}
                  onUpdateActivity={handleUpdateActivity}
                  onBeginActivity={handleBeginActivity}
                  onToggleFixed={handleToggleFixed}
                  onToggleRigid={handleToggleRigid}
                  onReorder={handleReorderActivities}
                  onDeleteActivity={handleDeleteActivity}
                  onSplitActivity={handleSplitActivity}
                  onInsertActivity={handleInsertActivity}
                />

                {calculatedActivities.length <= 2 && (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Click &quot;Add&quot; to insert activities between Start and End anchors.</p>
                    <p className="text-xs sm:text-sm mt-2 text-muted-foreground">
                      Start and End anchors define your schedule boundaries.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <List className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No schedule selected. Create a new one or select from the dropdown.</p>
                <button
                  onClick={handleNewSchedule}
                  className="mt-4 text-primary hover:underline text-sm sm:text-base"
                >
                  Create New Schedule
                </button>
              </div>
            )}
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            {currentSchedule && calculatedActivities.length > 2 ? (
              <StatsPanel activities={calculatedActivities} />
            ) : (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No data available. Add some activities first.</p>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="max-w-2xl">
              <NotificationSettingsPanel
                settings={settings}
                onUpdateSettings={updateSettings}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm text-muted-foreground">
          <p>
            SuperMemo Plan Web • {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} saved
          </p>
          <p className="mt-1 hidden sm:block">
            Shortcuts: Ctrl+S (Save) • Ctrl+N (New) • Ctrl+Enter (Add) • Ins (Insert)
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
