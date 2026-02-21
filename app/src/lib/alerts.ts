import { io, type Socket } from 'socket.io-client'
import type { SocketAlert } from './types'

const PRIMARY_URL = 'https://redalert.orielhaim.com'
const FALLBACK_URL = 'https://redalert.auto-host.xyz'

let socket: Socket | null = null

type AlertListener = (alert: SocketAlert) => void
const listeners = new Set<AlertListener>()

function broadcast(data: SocketAlert) {
  listeners.forEach(fn => fn(data))
}

export function connectAlerts(onAlert: AlertListener): () => void {
  listeners.add(onAlert)

  if (!socket) {
    socket = io(PRIMARY_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    })

    socket.on('alert', broadcast)

    socket.on('connect_error', () => {
      socket?.disconnect()
      socket = io(FALLBACK_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 10000,
      })
      socket.on('alert', broadcast)
    })
  }

  return () => {
    listeners.delete(onAlert)
    if (listeners.size === 0 && socket) {
      socket.disconnect()
      socket = null
    }
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
