// Notification Settings Component

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import type { AppSettings } from '@/types';
import { Bell, Volume2, TestTube } from 'lucide-react';

interface NotificationSettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export function NotificationSettingsPanel({
  settings,
  onUpdateSettings,
}: NotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SuperMemo Plan Test', {
        body: 'This is a test notification!',
        icon: '/favicon.ico',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when activities are ending
            </p>
          </div>
          <Switch
            checked={settings.notifications.enabled}
            onCheckedChange={(checked) =>
              onUpdateSettings({
                notifications: { ...settings.notifications, enabled: checked },
              })
            }
          />
        </div>

        {/* Permission Status */}
        {settings.notifications.enabled && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Browser Permission:{' '}
                <span
                  className={`font-medium ${
                    permission === 'granted'
                      ? 'text-green-500'
                      : permission === 'denied'
                      ? 'text-red-500'
                      : 'text-yellow-500'
                  }`}
                >
                  {permission}
                </span>
              </span>
              {permission !== 'granted' && (
                <Button size="sm" onClick={requestPermission}>
                  Request Permission
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Minutes Before */}
        {settings.notifications.enabled && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Notify Before End</Label>
              <span className="text-sm font-medium">
                {settings.notifications.minutesBefore} minutes
              </span>
            </div>
            <Slider
              value={[settings.notifications.minutesBefore]}
              onValueChange={([value]) =>
                onUpdateSettings({
                  notifications: { ...settings.notifications, minutesBefore: value },
                })
              }
              min={1}
              max={15}
              step={1}
            />
          </div>
        )}

        {/* Sound Enabled */}
        {settings.notifications.enabled && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Play Sound
              </Label>
              <p className="text-sm text-muted-foreground">
                Play alarm sound with notification
              </p>
            </div>
            <Switch
              checked={settings.notifications.soundEnabled}
              onCheckedChange={(checked) =>
                onUpdateSettings({
                  notifications: { ...settings.notifications, soundEnabled: checked },
                })
              }
            />
          </div>
        )}

        {/* Test Button */}
        {settings.notifications.enabled && permission === 'granted' && (
          <Button
            variant="outline"
            className="w-full"
            onClick={testNotification}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test Notification
          </Button>
        )}

        {/* Default Schedule Settings */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-4">Default Schedule Settings</h4>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Default Schedule Hours</Label>
              <input
                type="number"
                step="0.5"
                value={settings.defaultScheduleHours}
                onChange={(e) =>
                  onUpdateSettings({
                    defaultScheduleHours: parseFloat(e.target.value) || 16,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label>Default Start Time</Label>
              <input
                type="time"
                value={settings.defaultStartTime}
                onChange={(e) =>
                  onUpdateSettings({ defaultStartTime: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Auto Alarm</Label>
              <Switch
                checked={settings.autoAlarm}
                onCheckedChange={(checked) =>
                  onUpdateSettings({ autoAlarm: checked })
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
