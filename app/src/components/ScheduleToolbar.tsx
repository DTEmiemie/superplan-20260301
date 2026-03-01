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
import { useState } from 'react';

interface ScheduleToolbarProps {
  schedules: Schedule[];
  currentSchedule: Schedule | null;
  onNewSchedule: () => void;
  onSaveSchedule: () => void;
  onLoadSchedule: (id: string) => void;
  onDuplicateSchedule: () => void;
  onDeleteSchedule: () => void;
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

  const handleTotalHoursChange = (value: string) => {
    const hours = parseFloat(value);
    if (isNaN(hours) || hours < 0.5) return;
    onTotalHoursChange?.(Math.min(hours, 24));
  };

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
      {/* Top Row - Schedule Selector & Primary Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Schedule Selector */}
        <Select
          value={currentSchedule?.id ?? undefined}
          onValueChange={onLoadSchedule}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select schedule..." />
          </SelectTrigger>
          <SelectContent>
            {schedules.map((schedule) => (
              <SelectItem key={schedule.id} value={schedule.id}>
                {schedule.name} ({schedule.date})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
                onClick={onDeleteSchedule}
                disabled={!currentSchedule}
                className="h-9 text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>

            {/* Mobile Actions Dropdown */}
            <div className="flex sm:hidden items-center gap-2 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onDuplicateSchedule}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAdjustSchedule}>
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Adjust Schedule
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onResetSchedule}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onShowStats}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Statistics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDeleteSchedule} className="text-red-500">
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
