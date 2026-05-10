/** WebSocket URL for mixer/admin; in dev connect directly to the backend. */
export function backendWebSocketUrl(): string {
  if (import.meta.env.DEV) {
    const o = import.meta.env.VITE_WS_ORIGIN
    return o ?? 'ws://127.0.0.1:80'
  }
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${location.host}`
}
