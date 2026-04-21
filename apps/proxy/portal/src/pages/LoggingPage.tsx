import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';

export function LoggingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Logging</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Event Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Real-time log streaming will be added in a future update. This page
            will display device events, command history, and connection activity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
