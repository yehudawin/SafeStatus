import { io, type Socket } from 'socket.io-client'
import type { SocketAlert } from './types'

const PRIMARY_URL = 'https://redalert.orielhaim.com'
const FALLBACK_URL = 'https://redalert.auto-host.xyz'

type AlertListener = (alert: SocketAlert) => void
const listeners = new Set<AlertListener>()
let socket: Socket | null = null
let usingFallback = false
let fallbackAttempted = false

function broadcast(data: SocketAlert) {
  listeners.forEach(fn => fn(data))
}

function createSocket(url: string): Socket {
  return io(url, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 10000,
  })
}

function initSocket() {
  if (socket) return

  socket = createSocket(PRIMARY_URL)
  socket.on('alert', broadcast)

  socket.on('connect_error', () => {
    if (usingFallback || fallbackAttempted) return
    fallbackAttempted = true

    socket?.removeAllListeners()
    socket?.disconnect()

    socket = createSocket(FALLBACK_URL)
    usingFallback = true
    socket.on('alert', broadcast)

    socket.on('connect_error', () => {
      setTimeout(() => {
        if (listeners.size === 0) return
        fallbackAttempted = false
        usingFallback = false
        socket?.removeAllListeners()
        socket?.disconnect()
        socket = null
        initSocket()
      }, 30000)
    })
  })
}

function destroySocket() {
  socket?.removeAllListeners()
  socket?.disconnect()
  socket = null
  usingFallback = false
  fallbackAttempted = false
}

export function connectAlerts(onAlert: AlertListener): () => void {
  listeners.add(onAlert)
  initSocket()

  return () => {
    listeners.delete(onAlert)
    if (listeners.size === 0) destroySocket()
  }
}

export function injectDemoAlert(userCity?: string | null) {
  const cities = userCity ? [userCity] : ['תל אביב - יפו', 'ראשון לציון', 'חולון']
  const demo: SocketAlert = {
    cities,
    title: 'התראת דמו — צבע אדום',
    desc: `אזעקות נשמעות ב: ${cities.join(', ')}`,
    cat: 'צבע אדום',
  }
  broadcast(demo)
}
