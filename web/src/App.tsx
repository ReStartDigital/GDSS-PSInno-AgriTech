import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AppRouter } from './router'
import { useAuthStore } from './store/auth.store'
import './App.css'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export default function App() {
  useEffect(() => {
    // Session is persisted in localStorage by Zustand.
    // Simply mark initialized to allow router to proceed.
    useAuthStore.getState().setInitialized(true)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
