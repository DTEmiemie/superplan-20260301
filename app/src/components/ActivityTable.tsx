// Interactive Activity Table Component - Mobile Optimized

import { useState, useCallback } from 'react';
import type { Activity } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  GripVertical,
  Play,
  Clock,
  Lock,
  Shield,
  Check,
  AlertCircle,
  MoreVertical,
  Plus,
  Trash2,
  Scissors,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ActivityTableProps {
  activities: Activity[];
  onUpdateActivity: (index: number, updates: Partial<Activity>) => void;
  onBeginActivity: (index: number) => void;
  onToggleFixed: (index: number) => void;
  onToggleRigid: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDeleteActivity: (index: number) => void;
  onSplitActivity: (index: number) => void;
  onInsertActivity?: (index: number) => void;
  readOnly?: boolean;
}

export function ActivityTable({
  activities,
  onUpdateActivity,
  onBeginActivity,
  onToggleFixed,
  onToggleRigid,
  onReorder,
  onDeleteActivity,
  onSplitActivity,
  onInsertActivity,
  readOnly = false,
}: ActivityTableProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);

  const handleDragStart = useCallback((index: number) => {
    if (!readOnly) {
      setDraggingIndex(index);
    }
  }, [readOnly]);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggingIndex !== null && draggingIndex !== index) {
        onReorder(draggingIndex, index);
        setDraggingIndex(index);
      }
    },
    [draggingIndex, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  const handleCellEdit = useCallback(
    (row: number, col: string, value: string | number | boolean) => {
      const updates: Partial<Activity> = {};
      
      if (col === 'name') {
        updates.name = value as string;
      } else if (col === 'length') {
        updates.length = Math.max(0, parseInt(value as string) || 0);
      } else if (col === 'start') {
        const newStartTime = value as string;
        const originalStart = activities[row]?.start;
        updates.start = newStartTime;
        // Auto-mark as fixed when user manually sets start time
        if (newStartTime !== originalStart) {
          updates.isFixed = true;
        }
      }
      
      onUpdateActivity(row, updates);
      setEditingCell(null);
    },
    [onUpdateActivity, activities]
  );

  const getDelayColor = (delay: number) => {
    if (delay > 30) return 'text-red-500 font-medium';
    if (delay > 10) return 'text-yellow-500';
    if (delay < 0) return 'text-green-500';
    return 'text-muted-foreground';
  };

  const getPercentColor = (percent: number) => {
    if (percent < 80) return 'text-red-500';
    if (percent < 95) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Check if activity is an anchor (first or last)
  const isAnchor = (index: number) => index === 0 || index === activities.length - 1;

  return (
    <div className="rounded-md border overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="min-w-[900px] sm:min-w-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {!readOnly && <TableHead className="w-8 p-1 sm:p-2"></TableHead>}
              <TableHead className="w-10 sm:w-12 text-center p-1 sm:p-2">
                <span className="hidden sm:inline">F</span>
                <Lock className="h-3 w-3 sm:hidden mx-auto" />
              </TableHead>
              <TableHead className="w-10 sm:w-12 text-center p-1 sm:p-2">
                <span className="hidden sm:inline">R</span>
                <Shield className="h-3 w-3 sm:hidden mx-auto" />
              </TableHead>
              <TableHead className="w-10 sm:w-12 text-center p-1 sm:p-2">
                <span className="hidden sm:inline">Status</span>
                <span className="sm:hidden">●</span>
              </TableHead>
              {/* Column order: Length (4), Start (3), Activity (5) - wait, user wants: Len 4th, Start 3rd, Activity 5th */}
              {/* So: F, R, Status, Start, Length, ActLen, OptLen, Activity, Delay, %, Actions */}
              <TableHead className="w-16 sm:w-20 p-1 sm:p-2">Start</TableHead>
              <TableHead className="w-14 sm:w-20 text-right p-1 sm:p-2">
                <span className="hidden sm:inline">Length</span>
                <span className="sm:inline">Len</span>
              </TableHead>
              <TableHead className="w-14 sm:w-20 text-right p-1 sm:p-2">
                <span className="hidden sm:inline">ActLen</span>
                <span className="sm:inline">Act</span>
              </TableHead>
              <TableHead className="w-14 sm:w-20 text-right p-1 sm:p-2 hidden md:table-cell">OptLen</TableHead>
              <TableHead className="w-16 sm:w-20 p-1 sm:p-2 hidden lg:table-cell">OptStart</TableHead>
              <TableHead className="p-1 sm:p-2">Activity</TableHead>
              <TableHead className="w-12 sm:w-16 text-right p-1 sm:p-2">Delay</TableHead>
              <TableHead className="w-12 sm:w-16 text-right p-1 sm:p-2">%</TableHead>
              {!readOnly && <TableHead className="w-16 sm:w-24 p-1 sm:p-2">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity, index) => (
              <TableRow
                key={activity.id}
                draggable={!readOnly && !isAnchor(index)}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'transition-colors touch-manipulation',
                  activity.isActive && 'bg-blue-50 dark:bg-blue-950/30',
                  activity.isCompleted && 'bg-green-50 dark:bg-green-950/20 opacity-60',
                  draggingIndex === index && 'opacity-50',
                  isAnchor(index) && 'bg-amber-50/50 dark:bg-amber-950/20',
                  !readOnly && 'cursor-move'
                )}
              >
                {/* Drag Handle */}
                {!readOnly && (
                  <TableCell className="p-1 sm:p-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                )}

                {/* Fixed Checkbox */}
                <TableCell className="p-1 sm:p-2 text-center">
                  <Checkbox
                    checked={activity.isFixed}
                    onCheckedChange={() => onToggleFixed(index)}
                    disabled={readOnly}
                    className="h-4 w-4 sm:h-5 sm:w-5"
                  />
                </TableCell>

                {/* Rigid Checkbox */}
                <TableCell className="p-1 sm:p-2 text-center">
                  <Checkbox
                    checked={activity.isRigid}
                    onCheckedChange={() => onToggleRigid(index)}
                    disabled={readOnly}
                    className="h-4 w-4 sm:h-5 sm:w-5"
                  />
                </TableCell>

                {/* Status */}
                <TableCell className="p-1 sm:p-2 text-center">
                  {activity.isActive && (
                    <Play className="h-4 w-4 text-blue-500 inline" />
                  )}
                  {activity.isCompleted && (
                    <Check className="h-4 w-4 text-green-500 inline" />
                  )}
                  {!activity.isActive && !activity.isCompleted && activity.delay > 10 && (
                    <AlertCircle className="h-4 w-4 text-yellow-500 inline" />
                  )}
                  {isAnchor(index) && !activity.isActive && !activity.isCompleted && (
                    <span className="text-xs text-amber-500 font-bold">
                      {index === 0 ? 'S' : 'E'}
                    </span>
                  )}
                </TableCell>

                {/* Start (Column 3) */}
                <TableCell className="p-1 sm:p-2">
                  {editingCell?.row === index && editingCell?.col === 'start' ? (
                    <Input
                      autoFocus
                      type="time"
                      defaultValue={activity.start}
                      onBlur={(e) => handleCellEdit(index, 'start', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCellEdit(index, 'start', e.currentTarget.value);
                        }
                      }}
                      className="h-7 sm:h-8 text-sm"
                    />
                  ) : (
                    <span
                      onClick={() => !readOnly && setEditingCell({ row: index, col: 'start' })}
                      className={cn(
                        'cursor-pointer hover:bg-muted px-1 sm:px-2 py-1 rounded text-sm',
                        activity.isFixed && 'font-medium text-amber-600',
                        isAnchor(index) && 'font-medium'
                      )}
                    >
                      {activity.start}
                    </span>
                  )}
                </TableCell>

                {/* Length (Column 4) */}
                <TableCell className="p-1 sm:p-2 text-right">
                  {editingCell?.row === index && editingCell?.col === 'length' ? (
                    <Input
                      autoFocus
                      type="number"
                      defaultValue={activity.length}
                      onBlur={(e) => handleCellEdit(index, 'length', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCellEdit(index, 'length', e.currentTarget.value);
                        }
                      }}
                      className="h-7 sm:h-8 text-right text-sm"
                    />
                  ) : (
                    <span
                      onClick={() => !readOnly && setEditingCell({ row: index, col: 'length' })}
                      className="cursor-pointer hover:bg-muted px-1 sm:px-2 py-1 rounded text-sm"
                    >
                      {activity.length}
                    </span>
                  )}
                </TableCell>

                {/* ActLen (Actual) */}
                <TableCell className="p-1 sm:p-2 text-right font-medium text-sm">
                  {activity.actLen}
                </TableCell>

                {/* OptLen (Optimum) - Hidden on mobile */}
                <TableCell className="p-1 sm:p-2 text-right text-muted-foreground text-sm hidden md:table-cell">
                  {activity.optLen}
                </TableCell>

                {/* OptStart - Hidden on mobile */}
                <TableCell className="p-1 sm:p-2 text-muted-foreground text-sm hidden lg:table-cell">
                  {activity.optStart}
                </TableCell>

                {/* Activity Name (Column 5) */}
                <TableCell className="p-1 sm:p-2">
                  {editingCell?.row === index && editingCell?.col === 'name' ? (
                    <Input
                      autoFocus
                      defaultValue={activity.name}
                      onBlur={(e) => handleCellEdit(index, 'name', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCellEdit(index, 'name', e.currentTarget.value);
                        }
                      }}
                      className="h-7 sm:h-8 text-sm"
                    />
                  ) : (
                    <span
                      onClick={() => !readOnly && setEditingCell({ row: index, col: 'name' })}
                      className={cn(
                        'cursor-pointer hover:bg-muted px-1 sm:px-2 py-1 rounded block truncate max-w-[100px] sm:max-w-none',
                        !activity.name && 'text-muted-foreground italic',
                        isAnchor(index) && 'font-medium text-amber-700'
                      )}
                    >
                      {activity.name || 'Edit...'}
                    </span>
                  )}
                </TableCell>

                {/* Delay */}
                <TableCell className={cn('p-1 sm:p-2 text-right text-sm', getDelayColor(activity.delay))}>
                  {activity.delay > 0 ? `+${activity.delay}` : activity.delay}
                </TableCell>

                {/* Percent */}
                <TableCell className={cn('p-1 sm:p-2 text-right text-sm', getPercentColor(activity.percent))}>
                  {activity.percent}%
                </TableCell>

                {/* Actions */}
                {!readOnly && (
                  <TableCell className="p-1 sm:p-2">
                    {/* Desktop Actions */}
                    <div className="hidden sm:flex gap-1">
                      {!isAnchor(index) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => onBeginActivity(index)}
                            disabled={activity.isCompleted}
                            title="Begin activity"
                          >
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => onSplitActivity(index)}
                            title="Split activity"
                          >
                            <Scissors className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => onInsertActivity?.(index + 1)}
                            title="Insert after"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:text-red-600"
                            onClick={() => onDeleteActivity(index)}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </>
                      )}
                      {isAnchor(index) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => onInsertActivity?.(index + (index === 0 ? 1 : 0))}
                          title={index === 0 ? "Insert after start" : "Insert before end"}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                    {/* Mobile Actions Dropdown */}
                    <div className="sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!isAnchor(index) && (
                            <>
                              <DropdownMenuItem onClick={() => onBeginActivity(index)} disabled={activity.isCompleted}>
                                <Clock className="h-4 w-4 mr-2" />
                                Begin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onSplitActivity(index)}>
                                <Scissors className="h-4 w-4 mr-2" />
                                Split
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => onInsertActivity?.(
                            index === activities.length - 1 ? index : index + 1
                          )}>
                            <Plus className="h-4 w-4 mr-2" />
                            {index === activities.length - 1 ? 'Insert Before' : 'Insert After'}
                          </DropdownMenuItem>
                          {!isAnchor(index) && (
                            <>
                              <DropdownMenuItem onClick={() => onInsertActivity?.(index)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Insert Before
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onDeleteActivity(index)} className="text-red-500">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
