// Current Time Indicator Component - Mobile Optimized

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export function CurrentTimeIndicator() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white w-full sm:w-auto">
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-blue-100 text-xs sm:text-sm hidden sm:block">Current Time</p>
            <p className="text-2xl sm:text-4xl font-bold tracking-tight">
              {formatTime(currentTime)}
            </p>
            <p className="text-blue-100 mt-0.5 sm:mt-1 text-xs sm:text-sm truncate">
              <span className="sm:hidden">{formatDate(currentTime)}</span>
              <span className="hidden sm:inline">{formatFullDate(currentTime)}</span>
            </p>
          </div>
          <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-white/50 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
