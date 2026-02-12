import React from "react"
import { X  } from '@mui/icons-material'

const Toast = ({ children, ...props }: React.PropsWithChildren<any>) => {
  return (
    <div className="bg-white border rounded-md shadow-lg p-4 mb-2 max-w-md" {...props}>
      {children}
    </div>
  )
}

const ToastClose = ({ ...props }) => {
  return (
    <button className="absolute top-2 right-2 p-1 rounded-md text-gray-400 hover:text-gray-500" {...props}>
      <X className="h-4 w-4" />
    </button>
  )
}

const ToastTitle = ({ children, ...props }: React.PropsWithChildren<any>) => {
  return (
    <div className="text-sm font-medium" {...props}>
      {children}
    </div>
  )
}

const ToastDescription = ({ children, ...props }: React.PropsWithChildren<any>) => {
  return (
    <div className="text-sm text-gray-500" {...props}>
      {children}
    </div>
  )
}

const ToastProvider = ({ children }: React.PropsWithChildren<{}>) => {
  return <>{children}</>
}

const ToastViewport = () => {
  return (
    <div className="fixed bottom-0 right-0 flex flex-col p-4 gap-2 w-full md:max-w-[420px] max-h-screen z-50">
      {/* Toast elements will be rendered here */}
    </div>
  )
}

export {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
}