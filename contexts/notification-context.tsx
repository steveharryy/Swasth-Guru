'use client';

import { createContext, useContext, ReactNode } from 'react';
import { toast } from 'sonner';

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
      default:
        toast.info(message);
        break;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}