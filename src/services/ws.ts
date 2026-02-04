// src/services/ws.ts
// Lightweight WebSocket helper for the mechanic app
import { getToken } from './api';

const API_BASE_URL = (import.meta.env.VITE_API_URL as unknown as string) || 'http://localhost:8000';

export type JobEvent =
  | { type: 'new_job'; job: any; expires_at?: string }
  | { type: 'job_taken'; job_id: number; mechanic: { id: number; name: string }; eta_minutes?: number; taken_at?: string };

export function connectJobsWebSocket(onEvent: (evt: JobEvent) => void) {
  const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws/jobs';
  let ws: WebSocket | null = null;
  let reconnectTimer: number | null = null;

  function connect() {
    const token = getToken();
    const url = token ? `${wsUrl}?token=${token}` : wsUrl;

    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('[WS] connected to', url);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onEvent(data);
      } catch (err) {
        console.warn('[WS] failed to parse message', err);
      }
    };

    ws.onclose = (ev) => {
      console.log('[WS] closed - will retry in 2s', ev.reason);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(connect, 2000);
    };

    ws.onerror = (err) => {
      console.warn('[WS] error', err);
      ws?.close();
    };
  }

  connect();

  return {
    close: () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      ws?.close();
    },
  };
}
