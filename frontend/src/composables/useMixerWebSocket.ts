import { ref } from 'vue'
import { backendWebSocketUrl } from '@/lib/wsUrl'

export function useMixerWebSocket(options: {
  onMessage: (data: string) => void
  onConnectionLost?: () => void
}) {
  const disconnected = ref(true)
  let ws: WebSocket | null = null
  let wsTimeout: ReturnType<typeof setTimeout> | null = null

  function isSocketOpen(): boolean {
    return ws !== null && ws.readyState === WebSocket.OPEN
  }

  function sendOSC(address: string, args: unknown[] = []) {
    if (!isSocketOpen()) return
    ws!.send(JSON.stringify({ address, args }))
  }

  function noConnection() {
    if (ws) {
      ws.close()
      ws = null
    }
    if (wsTimeout) clearTimeout(wsTimeout)
    options.onConnectionLost?.()
    disconnected.value = true
    wsTimeout = setTimeout(startWebsocket, 2000)
  }

  function startWebsocket() {
    ws = new WebSocket(backendWebSocketUrl())
    ws.onopen = () => {
      disconnected.value = false
    }
    ws.onmessage = (e) => options.onMessage(String(e.data))
    ws.onclose = noConnection
    ws.onerror = noConnection

    if (wsTimeout) clearTimeout(wsTimeout)
    wsTimeout = setTimeout(() => {
      if (ws?.readyState === WebSocket.CONNECTING) {
        startWebsocket()
      }
    }, 2000)
  }

  function stopWebsocket() {
    if (wsTimeout) {
      clearTimeout(wsTimeout)
      wsTimeout = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
  }

  return {
    disconnected,
    sendOSC,
    isSocketOpen,
    startWebsocket,
    stopWebsocket,
  }
}
