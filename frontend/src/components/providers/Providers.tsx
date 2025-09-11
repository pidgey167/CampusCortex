'use client'

import { AuthProvider } from './AuthProvider'
import { SocketProvider } from './SocketProvider'
import { ThemeProvider } from './ThemeProvider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
