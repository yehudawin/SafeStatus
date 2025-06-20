import { useCallback } from 'react'
import { logger } from './logger'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from 'react-router-dom'

interface UseLoggerReturn {
  logInfo: (message: string, data?: any) => void
  logWarn: (message: string, data?: any) => void
  logError: (message: string, error?: Error | any) => void
  logUserAction: (action: string, data?: any) => void
  logApiCall: (endpoint: string, method: string, duration?: number) => void
  logApiError: (endpoint: string, method: string, error: any) => void
  logPageView: () => void
  logAuth: (action: string, data?: any) => void
  getRecentErrors: (count?: number) => any[]
  exportLogs: () => string
  clearLogs: () => void
}

export function useLogger(): UseLoggerReturn {
  const { user } = useAuth()
  const location = useLocation()
  
  const userPhone = user?.phone
  const currentPage = location.pathname

  const logInfo = useCallback((message: string, data?: any) => {
    logger.info(message, data, userPhone, currentPage)
  }, [userPhone, currentPage])

  const logWarn = useCallback((message: string, data?: any) => {
    logger.warn(message, data, userPhone, currentPage)
  }, [userPhone, currentPage])

  const logError = useCallback((message: string, error?: Error | any) => {
    logger.error(message, error, userPhone, currentPage)
  }, [userPhone, currentPage])

  const logUserAction = useCallback((action: string, data?: any) => {
    logger.logUserAction(action, userPhone, data)
  }, [userPhone])

  const logApiCall = useCallback((endpoint: string, method: string, duration?: number) => {
    logger.logApiCall(endpoint, method, userPhone, duration)
  }, [userPhone])

  const logApiError = useCallback((endpoint: string, method: string, error: any) => {
    logger.logApiError(endpoint, method, error, userPhone)
  }, [userPhone])

  const logPageView = useCallback(() => {
    logger.logPageView(currentPage, userPhone)
  }, [currentPage, userPhone])

  const logAuth = useCallback((action: string, data?: any) => {
    logger.logAuth(action, userPhone, data)
  }, [userPhone])

  const getRecentErrors = useCallback((count?: number) => {
    return logger.getRecentErrors(count)
  }, [])

  const exportLogs = useCallback(() => {
    return logger.exportLogs()
  }, [])

  const clearLogs = useCallback(() => {
    logger.clearLocalLogs()
  }, [])

  return {
    logInfo,
    logWarn,
    logError,
    logUserAction,
    logApiCall,
    logApiError,
    logPageView,
    logAuth,
    getRecentErrors,
    exportLogs,
    clearLogs
  }
} 