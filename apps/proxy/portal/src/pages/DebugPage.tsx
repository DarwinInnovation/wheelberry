import { useEffect, useState, useCallback } from 'react';
import { fetchDevices, sendCommand, type DeviceInfo } from '@/api/client';
import { useSocket } from '@/hooks/useSocket';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bug, Send, Wifi, WifiOff } from 'lucide-react';

export function DebugPage() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const { isDeviceConnected } = useSocket();
  const [selectedUid, setSelectedUid] = useState('');
  const [command, setCommand] = useState('');
  const [argsJson, setArgsJson] = useState('[]');
  const [response, setResponse] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchDevices().then(setDevices);
  }, []);

  const send = useCallback(async () => {
    if (!selectedUid || !command) return;
    setSending(true);
    setResponse(null);
    try {
      const args = JSON.parse(argsJson);
      const res = await sendCommand(selectedUid, command, args);
      setResponse(JSON.stringify(res, null, 2));
    } catch (err) {
      setResponse(err instanceof Error ? err.message : 'Error');
    } finally {
      setSending(false);
    }
  }, [selectedUid, command, argsJson]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Debug</h1>

      {/* Connected devices overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No devices registered.</p>
          ) : (
            <div className="space-y-2">
              {devices.map((d) => {
                const connected = isDeviceConnected(d.uid);
                return (
                  <div
                    key={d.uid}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">{d.name}</span>
                      <span className="ml-2 font-mono text-muted-foreground">{d.uid}</span>
                      <Badge variant="outline" className="ml-2">{d.app}</Badge>
                    </div>
                    <Badge variant={connected ? 'default' : 'destructive'} className="flex items-center gap-1">
                      {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {connected ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual command sender */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Command
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Device</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedUid}
                onChange={(e) => setSelectedUid(e.target.value)}
              >
                <option value="">Select device…</option>
                {devices.map((d) => (
                  <option key={d.uid} value={d.uid}>
                    {d.name} ({d.uid})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Command</label>
              <Input value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Boost" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Args (JSON)</label>
              <Input value={argsJson} onChange={(e) => setArgsJson(e.target.value)} placeholder="[]" />
            </div>
          </div>
          <Button onClick={send} disabled={sending || !selectedUid || !command}>
            <Send className="h-4 w-4" />
            {sending ? 'Sending…' : 'Send'}
          </Button>
          {response !== null && (
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm font-mono">
              {response}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
