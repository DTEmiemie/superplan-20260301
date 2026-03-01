// Statistics Panel Component - Mobile Optimized

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Activity } from '@/types';
import { calculateStats } from '@/lib/scheduleEngine';
import { Clock, TrendingDown, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface StatsPanelProps {
  activities: Activity[];
}

export function StatsPanel({ activities }: StatsPanelProps) {
  const stats = calculateStats(activities);
  const progress = stats.totalActivities > 0
    ? (stats.completedActivities / stats.totalActivities) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Overview Cards - Mobile: 2 cols, Desktop: 4 cols */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <span className="text-xl sm:text-2xl font-bold">
                {stats.completedActivities}/{stats.totalActivities}
              </span>
            </div>
            <Progress value={progress} className="mt-2 h-1.5 sm:h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Delay
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
              <span className="text-lg sm:text-2xl font-bold">
                {Math.floor(stats.totalDelay / 60)}h {stats.totalDelay % 60}m
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Behind schedule
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Time Lost
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
              <span className="text-lg sm:text-2xl font-bold">
                {Math.floor(stats.totalLoss / 60)}h {stats.totalLoss % 60}m
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              From compression
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
              <span className="text-xl sm:text-2xl font-bold">
                {Math.round(progress)}%
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Schedule adherence
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Delay Offenders */}
      {stats.offenders.length > 0 && (
        <Card>
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              Delay Offenders
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              {stats.offenders.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded-lg"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-medium text-sm sm:text-base truncate">{activity.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Planned: {activity.length}m | Actual: {activity.actLen}m
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base sm:text-lg font-bold text-red-500">
                      +{activity.delay}m
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">delay</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Breakdown */}
      <Card>
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-base sm:text-lg">Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="space-y-2 sm:space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-2 sm:gap-4 p-2 hover:bg-muted rounded"
              >
                <div className="w-20 sm:w-32 truncate font-medium text-sm sm:text-base">
                  {activity.name}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-2.5 sm:h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        activity.isCompleted
                          ? 'bg-green-500'
                          : activity.isActive
                          ? 'bg-blue-500'
                          : activity.delay > 0
                          ? 'bg-yellow-500'
                          : 'bg-gray-300'
                      }`}
                      style={{ width: `${Math.min(activity.percent, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="w-14 sm:w-20 text-right text-xs sm:text-sm flex-shrink-0">
                  {activity.actLen}/{activity.length}m
                </div>
                <div className="w-10 sm:w-16 text-right text-xs sm:text-sm flex-shrink-0">
                  {activity.percent}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
