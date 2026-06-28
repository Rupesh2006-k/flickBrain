import React, { createContext, useState, useCallback, useContext } from 'react'
import {
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiCloseLine
} from 'react-icons/ri'

export const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }, [removeToast])

  const icons = {
    success: <RiCheckboxCircleLine className="w-5 h-5 text-[#10b981]" />,
    error: <RiErrorWarningLine className="w-5 h-5 text-[#ef4444]" />,
    info: <RiInformationLine className="w-5 h-5 text-[#7c3aed]" />
  }

  const borderStyles = {
    success: 'border-l-4 border-l-[#10b981] border-y border-r border-[#1e1e2e]',
    error: 'border-l-4 border-l-[#ef4444] border-y border-r border-[#1e1e2e]',
    info: 'border-l-4 border-l-[#7c3aed] border-y border-r border-[#1e1e2e]'
  }

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-[#13131a] shadow-2xl backdrop-blur-md max-w-sm pointer-events-auto transition-all duration-300 transform translate-x-0 ${borderStyles[t.type] || borderStyles.info}`}
          >
            <div className="flex-shrink-0 animate-bounce">
              {icons[t.type] || icons.info}
            </div>
            <div className="flex-grow text-sm font-medium text-slate-200 leading-snug pr-2">
              {t.message}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Close"
            >
              <RiCloseLine className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
