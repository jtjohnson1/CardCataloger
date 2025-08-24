import { useState, useEffect } from 'react'
import { getSystemStatus } from '@/api/system'

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'error'
  database: boolean
  ollama: boolean
}

export function useSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: 'healthy',
    database: true,
    ollama: true
  })

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getSystemStatus()
        setSystemStatus(status)
      } catch (error) {
        console.error('Failed to fetch system status:', error)
        setSystemStatus({
          overall: 'error',
          database: false,
          ollama: false
        })
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return { systemStatus }
}