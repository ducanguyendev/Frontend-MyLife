import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/shared/context/ThemeContext.tsx'
import { AuthProvider } from '@/features/auth/context/AuthContext.tsx'
import './index.css'
import '@/shared/i18n'
import App from './App.tsx'
import { MotionConfig } from 'framer-motion'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MotionConfig reducedMotion="user">
            <ErrorBoundary><App /></ErrorBoundary>
          </MotionConfig>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
