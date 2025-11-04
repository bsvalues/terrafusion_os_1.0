import { useState } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

const toasts: Toast[] = []
let toastIdCounter = 0

export function useToast() {
  const [, forceUpdate] = useState({})

  const toast = (options: ToastOptions) => {
    const id = `toast-${++toastIdCounter}`
    const newToast: Toast = {
      id,
      ...options,
      variant: options.variant || 'default'
    }
    
    toasts.push(newToast)
    forceUpdate({})
    
    setTimeout(() => {
      const index = toasts.findIndex(t => t.id === id)
      if (index > -1) {
        toasts.splice(index, 1)
        forceUpdate({})
      }
    }, 5000)
  }

  const dismiss = (id: string) => {
    const index = toasts.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.splice(index, 1)
      forceUpdate({})
    }
  }

  return { toast, dismiss, toasts: [...toasts] }
}