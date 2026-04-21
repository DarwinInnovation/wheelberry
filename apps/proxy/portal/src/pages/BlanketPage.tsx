import { useEffect, useState, useCallback } from 'react';
import { fetchDevices, sendCommand, type DeviceInfo } from '@/api/client';
import { useSocket } from '@/hooks/useSocket';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Thermometer, Power, Zap, Clock, WifiOff, Wifi } from 'lucide-react';

export function BlanketPage() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDeviceConnected } = useSocket();

  useEffect(() => {
    fetchDevices('blanket')
      .then(setDevices)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Loading devices…</p>;
  }

  if (devices.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Blanket Control</h1>
        <p className="text-muted-foreground">No blanket devices found for your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Blanket Control</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {devices.map((device) => (
          <BlanketDeviceCard
            key={device.uid}
            device={device}
            connected={isDeviceConnected(device.uid)}
          />
        ))}
      </div>
    </div>
  );
}

function BlanketDeviceCard({ device, connected }: { device: DeviceInfo; connected: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [extendDuration, setExtendDuration] = useState('PT30M');

  const config = device.config as { switchIP?: string; timings?: string[][] };

  const execute = useCallback(
    async (cmd: string, args: unknown[] = []) => {
      setBusy(cmd);
      setResult(null);
      try {
        await sendCommand(device.uid, cmd, args);
        setResult({ ok: true, message: `${cmd} sent successfully` });
      } catch (err) {
        setResult({ ok: false, message: err instanceof Error ? err.message : 'Command failed' });
      } finally {
        setBusy(null);
      }
    },
    [device.uid]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            {device.name}
          </CardTitle>
          <Badge variant={connected ? 'default' : 'destructive'} className="flex items-center gap-1">
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <CardDescription>{device.uid}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Config info */}
        <div className="space-y-2 rounded-md bg-muted p-3 text-sm">
          {config.switchIP && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Switch IP</span>
              <span className="font-mono">{config.switchIP}</span>
            </div>
          )}
          {config.timings && config.timings.length > 0 && (
            <div>
              <span className="text-muted-foreground">Schedule</span>
              <div className="mt-1 space-y-1">
                {config.timings.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono">{t[0]} – {t[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Commands */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => execute('Boost')}
            disabled={!connected || busy !== null}
          >
            <Zap className="h-4 w-4" />
            {busy === 'Boost' ? 'Boosting…' : 'Boost (20 min)'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => execute('Off')}
            disabled={!connected || busy !== null}
          >
            <Power className="h-4 w-4" />
            {busy === 'Off' ? 'Turning off…' : 'Off'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={extendDuration}
            onChange={(e) => setExtendDuration(e.target.value)}
            placeholder="PT30M"
            className="w-28"
          />
          <Button
            variant="outline"
            onClick={() => execute('Extend', [extendDuration])}
            disabled={!connected || busy !== null}
          >
            <Clock className="h-4 w-4" />
            {busy === 'Extend' ? 'Extending…' : 'Extend'}
          </Button>
        </div>

        {/* Result feedback */}
        {result && (
          <p className={`text-sm ${result.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {result.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
