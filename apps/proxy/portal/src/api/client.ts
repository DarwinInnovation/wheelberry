const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (res.status === 401) {
    window.location.href = '/auth/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export interface UserInfo {
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface SystemInfo {
  uptime: number;
  connectedDevices: number;
  apps: string[];
}

export interface DeviceInfo {
  uid: string;
  app: string;
  name: string;
  config: Record<string, unknown>;
  connected: boolean;
}

export interface AppInfo {
  name: string;
  intents: { name: string; slots: string[] }[];
}

export function fetchMe(): Promise<UserInfo> {
  return request('/me');
}

export function fetchSystem(): Promise<SystemInfo> {
  return request('/system');
}

export function fetchDevices(app?: string): Promise<DeviceInfo[]> {
  const qs = app ? `?app=${encodeURIComponent(app)}` : '';
  return request(`/devices${qs}`);
}

export function fetchDevice(uid: string): Promise<DeviceInfo> {
  return request(`/devices/${encodeURIComponent(uid)}`);
}

export function sendCommand(uid: string, command: string, args: unknown[] = []): Promise<{ result: unknown }> {
  return request(`/devices/${encodeURIComponent(uid)}/command`, {
    method: 'POST',
    body: JSON.stringify({ command, args }),
  });
}

export function fetchApps(): Promise<AppInfo[]> {
  return request('/apps');
}
