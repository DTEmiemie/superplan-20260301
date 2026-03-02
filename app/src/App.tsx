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
  // Storage hook — currentSchedule is derived from schedules array (single source of truth)
  const {
    schedules,
    settings,
    currentSchedule,
    isLoaded,
    createNewSchedule,
    deleteSchedule,
    switchSchedule,
    duplicateSchedule,
    updateCurrentSchedule,
    updateSettings,
  } = useScheduleStorage();

  // Calculated activities (derived from currentSchedule)
  const [calculatedActivities, setCalculatedActivities] = useState<Schedule['activities']>([]);

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
    createNewSchedule();
    toast.success('New schedule created');
  }, [createNewSchedule]);

  const handleSaveSchedule = useCallback(() => {
    if (currentSchedule) {
      // Already auto-saved, just show confirmation
      toast.success('Schedule saved');
    }
  }, [currentSchedule]);

  const handleLoadSchedule = useCallback(
    (id: string) => {
      switchSchedule(id);
    },
    [switchSchedule]
  );

  const handleDuplicateSchedule = useCallback(() => {
    if (currentSchedule) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const newDate = tomorrow.toISOString().split('T')[0];

      const duplicated = duplicateSchedule(currentSchedule.id, newDate);
      if (duplicated) {
        toast.success('Schedule duplicated for tomorrow');
      }
    }
  }, [currentSchedule, duplicateSchedule]);

  const handleDeleteSchedule = useCallback(() => {
    if (currentSchedule) {
      deleteSchedule(currentSchedule.id);
      toast.success('Schedule deleted');
    }
  }, [currentSchedule, deleteSchedule]);

  const handleUpdateSchedule = useCallback(
    (updates: Partial<Schedule>) => {
      updateCurrentSchedule((prev) => ({ ...prev, ...updates }));
    },
    [updateCurrentSchedule]
  );

  // Handle total hours change - updates end anchor
  const handleTotalHoursChange = useCallback(
    (hours: number) => {
      updateCurrentSchedule((prev) => {
        const updatedActivities = updateAnchorActivities(prev.activities, hours);
        return { ...prev, totalHours: hours, activities: updatedActivities };
      });
    },
    [updateCurrentSchedule]
  );

  // Activity operations
  const handleAddActivity = useCallback(() => {
    updateCurrentSchedule((prev) => {
      const insertIndex = prev.activities.length - 1;
      const updatedActivities = insertActivity(prev.activities, insertIndex);
      return { ...prev, activities: updatedActivities };
    });
    toast.success('Activity added');
  }, [updateCurrentSchedule]);

  const handleInsertActivity = useCallback(
    (index: number) => {
      updateCurrentSchedule((prev) => {
        const updatedActivities = insertActivity(prev.activities, index);
        return { ...prev, activities: updatedActivities };
      });
      toast.success('Activity inserted');
    },
    [updateCurrentSchedule]
  );

  const handleUpdateActivity = useCallback(
    (index: number, updates: Partial<Schedule['activities'][0]>) => {
      updateCurrentSchedule((prev) => {
        const updatedActivities = [...prev.activities];
        updatedActivities[index] = { ...updatedActivities[index], ...updates };
        return { ...prev, activities: updatedActivities };
      });
    },
    [updateCurrentSchedule]
  );

  const handleBeginActivity = useCallback(
    (index: number) => {
      updateCurrentSchedule((prev) => {
        const updatedActivities = beginActivity(prev.activities, index, prev.totalHours);
        const activity = updatedActivities[index];
        if (activity) {
          // Use setTimeout to avoid toast during render
          setTimeout(() => {
            toast.success(`Started: ${activity.name}`, {
              description: `Allocated ${activity.actLen} minutes`,
            });
          }, 0);
        }
        return { ...prev, activities: updatedActivities };
      });

      if (settings.notifications.enabled) {
        requestPermission();
      }
    },
    [updateCurrentSchedule, settings.notifications.enabled, requestPermission]
  );

  const handleToggleFixed = useCallback(
    (index: number) => {
      updateCurrentSchedule((prev) => {
        if (index === prev.activities.length - 1) {
          setTimeout(() => toast.info('End anchor must remain fixed'), 0);
          return prev;
        }
        const updatedActivities = [...prev.activities];
        updatedActivities[index] = {
          ...updatedActivities[index],
          isFixed: !updatedActivities[index].isFixed,
        };
        return { ...prev, activities: updatedActivities };
      });
    },
    [updateCurrentSchedule]
  );

  const handleToggleRigid = useCallback(
    (index: number) => {
      updateCurrentSchedule((prev) => {
        const updatedActivities = [...prev.activities];
        updatedActivities[index] = {
          ...updatedActivities[index],
          isRigid: !updatedActivities[index].isRigid,
        };
        return { ...prev, activities: updatedActivities };
      });
    },
    [updateCurrentSchedule]
  );

  const handleReorderActivities = useCallback(
    (fromIndex: number, toIndex: number) => {
      updateCurrentSchedule((prev) => {
        const updatedActivities = reorderActivity(prev.activities, fromIndex, toIndex);
        return { ...prev, activities: updatedActivities };
      });
    },
    [updateCurrentSchedule]
  );

  const handleDeleteActivity = useCallback(
    (index: number) => {
      updateCurrentSchedule((prev) => {
        if (prev.activities.length <= 2) {
          setTimeout(() => toast.error('Cannot delete - must keep Start/End anchors'), 0);
          return prev;
        }
        if (index === 0 || index === prev.activities.length - 1) {
          setTimeout(() => toast.error('Cannot delete anchor activities'), 0);
          return prev;
        }
        const activities = [...prev.activities];
        activities.splice(index, 1);
        setTimeout(() => toast.success('Activity deleted'), 0);
        return { ...prev, activities };
      });
    },
    [updateCurrentSchedule]
  );

  const handleSplitActivity = useCallback(
    (index: number) => {
      updateCurrentSchedule((prev) => {
        if (index === 0 || index === prev.activities.length - 1) {
          return prev;
        }
        const activities = [...prev.activities];
        const activity = activities[index];
        const halfLength = Math.max(1, Math.floor(activity.length / 2));
        const remainLength = Math.max(1, activity.length - halfLength);

        activities[index] = { ...activity, length: halfLength };
        activities.splice(index + 1, 0, {
          ...createActivity(`${activity.name} (part 2)`, remainLength),
        });
        return { ...prev, activities };
      });
    },
    [updateCurrentSchedule]
  );

  const handleAdjustSchedule = useCallback(() => {
    updateCurrentSchedule((prev) => ({
      ...prev,
      activities: adjustSchedule(prev.activities),
    }));
    toast.success('Schedule adjusted - ActLen copied to Length');
  }, [updateCurrentSchedule]);

  const handleResetSchedule = useCallback(() => {
    updateCurrentSchedule((prev) => ({
      ...prev,
      activities: prev.activities.map((a, i) => ({
        ...a,
        isCompleted: false,
        isActive: false,
        isFixed: i === prev.activities.length - 1,
      })),
    }));
    toast.success('Schedule reset');
  }, [updateCurrentSchedule]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveSchedule();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewSchedule();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAddActivity();
      }
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
