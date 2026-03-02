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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// Radix/shadcn overlays use exit animations; on some mobile browsers (Edge/Android)
// deleting the schedule while portals are still animating out can trigger a React DOM
// reconciliation crash: "Failed to execute 'insertBefore' ...".
// Keep a small buffer beyond the CSS animation duration to avoid the boundary race.
const MENU_PORTAL_UNMOUNT_TIMEOUT_MS = 800;
const DIALOG_PORTAL_UNMOUNT_TIMEOUT_MS = 1200;

const SCHEDULE_TOOLBAR_MENU_CONTENT_SELECTOR = '[data-schedule-toolbar-menu-content]';
const SCHEDULE_DELETE_DIALOG_CONTENT_SELECTOR = '[data-schedule-delete-dialog-content]';

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
  const [pendingMenuAction, setPendingMenuAction] = useState<
    'duplicate' | 'adjust' | 'reset' | 'stats' | 'request-delete' | null
  >(null);

  const waitForElementToDisappear = useCallback((selector: string, timeoutMs: number) => {
    if (typeof document === 'undefined') return Promise.resolve();
    const start = Date.now();

    return new Promise<void>((resolve) => {
      const tick = () => {
        const stillThere = document.querySelector(selector);
        if (!stillThere) return resolve();
        if (Date.now() - start > timeoutMs) return resolve();
        requestAnimationFrame(tick);
      };
      tick();
    });
  }, []);

  const handleTotalHoursChange = (value: string) => {
    const hours = parseFloat(value);
    if (isNaN(hours) || hours < 0.5) return;
    onTotalHoursChange?.(Math.min(hours, 24));
  };

  const handleDeleteDialogOpenChange = useCallback(
    (open: boolean) => {
      setShowDeleteConfirm(open);
      // If user cancels/closes the dialog, clear the target.
      // If we're confirming delete, keep the target until the portal is fully removed.
      if (!open && pendingDeleteId === null) {
        setDeleteTarget(null);
      }
    },
    [pendingDeleteId]
  );

  // Request delete — open confirmation dialog
  const requestDelete = useCallback(() => {
    if (!currentSchedule) return;
    setDeleteTarget({ id: currentSchedule.id, name: currentSchedule.name });
    setShowDeleteConfirm(true);
  }, [currentSchedule]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setPendingDeleteId(deleteTarget.id);
    setShowDeleteConfirm(false);
  }, [deleteTarget]);

  // Run the pending mobile-menu action only after the DropdownMenu portal fully unmounts.
  useEffect(() => {
    if (!pendingMenuAction) return;
    if (mobileMenuOpen) return;

    let cancelled = false;
    (async () => {
      await waitForElementToDisappear(
        SCHEDULE_TOOLBAR_MENU_CONTENT_SELECTOR,
        MENU_PORTAL_UNMOUNT_TIMEOUT_MS
      );
      if (cancelled) return;

      switch (pendingMenuAction) {
        case 'duplicate':
          onDuplicateSchedule();
          break;
        case 'adjust':
          onAdjustSchedule();
          break;
        case 'reset':
          onResetSchedule();
          break;
        case 'stats':
          onShowStats();
          break;
        case 'request-delete':
          requestDelete();
          break;
      }

      setPendingMenuAction(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    pendingMenuAction,
    mobileMenuOpen,
    waitForElementToDisappear,
    onDuplicateSchedule,
    onAdjustSchedule,
    onResetSchedule,
    onShowStats,
    requestDelete,
  ]);

  // Perform the actual schedule deletion only after the AlertDialog portal unmounts.
  useEffect(() => {
    if (!pendingDeleteId) return;
    if (showDeleteConfirm) return;

    let cancelled = false;
    (async () => {
      await waitForElementToDisappear(
        SCHEDULE_DELETE_DIALOG_CONTENT_SELECTOR,
        DIALOG_PORTAL_UNMOUNT_TIMEOUT_MS
      );
      if (cancelled) return;

      onDeleteSchedule(pendingDeleteId);
      setPendingDeleteId(null);
      setDeleteTarget(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingDeleteId, showDeleteConfirm, waitForElementToDisappear, onDeleteSchedule]);

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={handleDeleteDialogOpenChange}>
        <AlertDialogContent
          className="max-w-sm"
          data-schedule-delete-dialog-content=""
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <DropdownMenu onOpenChange={setMobileMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48"
                  data-schedule-toolbar-menu-content=""
                >
                  <DropdownMenuItem onSelect={() => setPendingMenuAction('duplicate')}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setPendingMenuAction('adjust')}>
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Adjust Schedule
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setPendingMenuAction('reset')}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setPendingMenuAction('stats')}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Statistics
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setPendingMenuAction('request-delete')}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
