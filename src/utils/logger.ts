export interface LogLevel {
  INFO: 'info'
  WARN: 'warn'  
  ERROR: 'error'
}

interface LogEntry {
  level: string
  message: string
  data?: any
  userPhone?: string
  page?: string
  timestamp: string
  userAgent: string
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000

  info(message: string, data?: any, userPhone?: string, page?: string) {
    this.log('info', message, data, userPhone, page)
  }

  warn(message: string, data?: any, userPhone?: string, page?: string) {
    this.log('warn', message, data, userPhone, page)
  }

  error(message: string, error?: any, userPhone?: string, page?: string) {
    this.log('error', message, error, userPhone, page)
  }

  private log(level: string, message: string, data?: any, userPhone?: string, page?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      userPhone,
      page,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    }

    this.logs.push(entry)

    // Keep only last maxLogs logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output in development
    if (import.meta.env.DEV) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || '')
    }

    // TODO: In production, send critical errors to remote logging service
    if (level === 'error' && !import.meta.env.DEV) {
      // Future: Send to Sentry, LogRocket, or similar service
    }
  }

  logUserAction(action: string, userPhone?: string, data?: any) {
    this.info(`פעולת משתמש: ${action}`, data, userPhone)
  }

  logApiCall(endpoint: string, method: string, userPhone?: string, duration?: number) {
    this.info(`קריאת API: ${method} ${endpoint}`, { duration }, userPhone)
  }

  logApiError(endpoint: string, method: string, error: any, userPhone?: string) {
    this.error(`שגיאת API: ${method} ${endpoint}`, error, userPhone)
  }

  logPageView(page: string, userPhone?: string) {
    this.info(`צפייה בדף: ${page}`, null, userPhone, page)
  }

  logAuth(action: string, userPhone?: string, data?: any) {
    this.info(`אימות: ${action}`, data, userPhone)
  }

  getRecentErrors(count: number = 10): LogEntry[] {
    return this.logs
      .filter(log => log.level === 'error')
      .slice(-count)
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  clearLocalLogs(): void {
    this.logs = []
  }

  // Get logs for specific user (useful for debugging)
  getLogsForUser(userPhone: string): LogEntry[] {
    return this.logs.filter(log => log.userPhone === userPhone)
  }

  // Get logs for specific page
  getLogsForPage(page: string): LogEntry[] {
    return this.logs.filter(log => log.page === page)
  }

  // Get logs by level
  getLogsByLevel(level: string): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  // Get recent logs (last N entries)
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count)
  }
}

export const logger = new Logger() 