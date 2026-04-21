import { useEffect, useState } from 'react';
import { fetchSystem, fetchMe, fetchApps, type SystemInfo, type UserInfo, type AppInfo } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, User, Layers } from 'lucide-react';

export function InfoPage() {
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [apps, setApps] = useState<AppInfo[]>([]);

  useEffect(() => {
    fetchSystem().then(setSystem);
    fetchMe().then(setUser);
    fetchApps().then(setApps);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Information</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {system ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm font-medium">{formatUptime(system.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Connected Devices</span>
                  <span className="text-sm font-medium">{system.connectedDevices}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Registered Apps</span>
                  <span className="text-sm font-medium">{system.apps.length}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </CardContent>
        </Card>

        {/* User Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </CardContent>
        </Card>

        {/* Apps & Skills */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Apps &amp; Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apps.length > 0 ? (
              <div className="space-y-4">
                {apps.map((app) => (
                  <div key={app.name}>
                    <h3 className="text-sm font-semibold capitalize">{app.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {app.intents.map((intent) => (
                        <Badge key={intent.name} variant="outline">
                          {intent.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
