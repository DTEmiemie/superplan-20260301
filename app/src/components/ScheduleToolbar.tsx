// Schedule Toolbar Component - Mobile Optimized

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Schedule } from '@/types';
import {
  Plus,
  Save,
  FilePlus,
  Copy,
  Trash2,
  Settings,
  BarChart3,
  SlidersHorizontal,
  RotateCcw,
  MoreHorizontal,
  Clock,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

interface ScheduleToolbarProps {
  schedules: Schedule[];
  currentSchedule: Schedule | null;
  onNewSchedule: () => void;
  onSaveSchedule: () => void;
  onLoadSchedule: (id: string) => void;
  onDuplicateSchedule: () => void;
  onDeleteSchedule: (id: string) => void;
  onAdjustSchedule: () => void;
  onResetSchedule: () => void;
  onShowStats: () => void;
  onUpdateSchedule: (updates: Partial<Schedule>) => void;
  onAddActivity: () => void;
  onTotalHoursChange?: (hours: number) => void;
}

export function ScheduleToolbar({
  schedules,
  currentSchedule,
  onNewSchedule,
  onSaveSchedule,
  onLoadSchedule,
  onDuplicateSchedule,
  onDeleteSchedule,
  onAdjustSchedule,
  onResetSchedule,
  onShowStats,
  onUpdateSchedule,
  onAddActivity,
  onTotalHoursChange,
}: ScheduleToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTotalHoursChange = (value: string) => {
    const hours = parseFloat(value);
    if (isNaN(hours) || hours < 0.5) return;
    onTotalHoursChange?.(Math.min(hours, 24));
  };

  // Request delete — open confirmation dialog
  const requestDelete = useCallback(() => {
    if (!currentSchedule) return;
    setDeleteTarget({ id: currentSchedule.id, name: currentSchedule.name });
    setShowDeleteConfirm(true);
  }, [currentSchedule]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    if (pendingDeleteId === null) {
      setDeleteTarget(null);
    }
  }, [pendingDeleteId]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setPendingDeleteId(deleteTarget.id);
    setShowDeleteConfirm(false);
  }, [deleteTarget]);

  // Perform the actual schedule deletion after the confirmation dialog is closed.
  useEffect(() => {
    if (!pendingDeleteId) return;
    if (showDeleteConfirm) return;

    onDeleteSchedule(pendingDeleteId);
    setPendingDeleteId(null);
    setDeleteTarget(null);
  }, [pendingDeleteId, showDeleteConfirm, onDeleteSchedule]);

  // Close overlays on Escape.
  useEffect(() => {
    if (!mobileMenuOpen && !showDeleteConfirm) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMobileMenuOpen(false);
      cancelDelete();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen, showDeleteConfirm, cancelDelete]);

  const runMobileAction = useCallback(
    (action: () => void) => {
      setMobileMenuOpen(false);
      // Defer to the next task so the menu unmounts before running actions.
      setTimeout(action, 0);
    },
    []
  );

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
      {/* Delete Confirmation Dialog (non-portal, mobile-safe) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onMouseDown={cancelDelete}
            onTouchStart={cancelDelete}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            className="bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-sm"
          >
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <h2 className="text-lg font-semibold">Delete Schedule</h2>
              <p className="text-muted-foreground text-sm">
                Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Row - Schedule Selector & Primary Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Schedule Selector */}
        {currentSchedule && schedules.length > 0 ? (
          <Select
            value={currentSchedule.id}
            onValueChange={onLoadSchedule}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {schedules.map((schedule) => (
                <SelectItem key={schedule.id} value={schedule.id}>
                  {schedule.name} ({schedule.date})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="w-full sm:w-48 h-10 flex items-center px-3 text-sm text-muted-foreground border rounded-md">
            No schedules yet
          </div>
        )}

        {/* Primary Actions - Always Visible */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="default"
            size="sm"
            onClick={onNewSchedule}
            className="h-9 px-2 sm:px-3"
          >
            <FilePlus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">New</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSaveSchedule}
            disabled={!currentSchedule}
            className="h-9 px-2 sm:px-3"
          >
            <Save className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>

      {/* Second Row - Schedule Info & Operations */}
      {currentSchedule && (
        <div className="flex flex-col gap-3 pt-2 border-t">
          {/* Schedule Parameters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Total Hours - Editable */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-1">
                <Label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Hours:</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="24"
                  value={currentSchedule.totalHours}
                  onChange={(e) => handleTotalHoursChange(e.target.value)}
                  className="w-16 sm:w-20 h-8 text-sm"
                />
              </div>
            </div>

            {/* Start Time */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Label className="text-xs sm:text-sm text-muted-foreground">Start:</Label>
                <Input
                  type="time"
                  value={currentSchedule.startTime}
                  onChange={(e) => onUpdateSchedule({ startTime: e.target.value })}
                  className="w-20 sm:w-24 h-8 text-sm"
                />
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Label className="text-xs sm:text-sm text-muted-foreground">Date:</Label>
                <Input
                  type="date"
                  value={currentSchedule.date}
                  onChange={(e) => onUpdateSchedule({ date: e.target.value })}
                  className="w-32 sm:w-36 h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Operations */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Add Activity - Primary on mobile */}
            <Button
              variant="default"
              size="sm"
              onClick={onAddActivity}
              className="h-9 px-2 sm:px-3"
            >
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Add</span>
            </Button>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDuplicateSchedule}
                disabled={!currentSchedule}
                className="h-9"
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onAdjustSchedule}
                disabled={!currentSchedule}
                title="Copy ActLen to Length"
                className="h-9"
              >
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                Adjust
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onResetSchedule}
                disabled={!currentSchedule}
                className="h-9"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onShowStats}
                disabled={!currentSchedule}
                className="h-9"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Stats
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={requestDelete}
                disabled={!currentSchedule}
                className="h-9 text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>

            {/* Mobile Actions Dropdown */}
            <div className="flex sm:hidden items-center gap-2 ml-auto">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2 relative z-50"
                  aria-haspopup="menu"
                  aria-expanded={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>

                {mobileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onMouseDown={() => setMobileMenuOpen(false)}
                      onTouchStart={() => setMobileMenuOpen(false)}
                    />
                    <div
                      role="menu"
                      className="bg-popover text-popover-foreground absolute right-0 top-full mt-1 z-50 w-48 overflow-hidden rounded-md border p-1 shadow-md"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                        onClick={() => runMobileAction(onDuplicateSchedule)}
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                        onClick={() => runMobileAction(onAdjustSchedule)}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Adjust Schedule
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                        onClick={() => runMobileAction(onResetSchedule)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                        onClick={() => runMobileAction(onShowStats)}
                      >
                        <BarChart3 className="h-4 w-4" />
                        Statistics
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-red-500 relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                        onClick={() => runMobileAction(requestDelete)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-2 sm:px-3">
                  <Settings className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Schedule Settings</DialogTitle>
                  <DialogDescription>
                    Configure your schedule parameters
                  </DialogDescription>
                </DialogHeader>

                {currentSchedule && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Schedule Name</Label>
                      <Input
                        value={currentSchedule.name}
                        onChange={(e) => onUpdateSchedule({ name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Total Hours</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={currentSchedule.totalHours}
                          onChange={(e) => handleTotalHoursChange(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={currentSchedule.startTime}
                          onChange={(e) => onUpdateSchedule({ startTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={currentSchedule.date}
                        onChange={(e) => onUpdateSchedule({ date: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button onClick={() => setShowSettings(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  );
}
