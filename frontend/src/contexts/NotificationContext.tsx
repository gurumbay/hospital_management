import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AlertColor } from '@mui/material';
import { Snackbar, Alert } from '@mui/material';

interface Notification {
  id: string;
  message: string;
  type: AlertColor;
}

interface NotificationContextType {
  notify: (message: string, type?: AlertColor) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (message: string, type: AlertColor = 'info') => {
    const id = Date.now().toString();
    const notification: Notification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  React.useEffect(() => {
    const handler = (e: Event) => {
      try {
        // @ts-ignore
        const detail = e.detail || {};
        const message = detail.message || 'API error';
        const status = detail.status;
        // Use error severity for non-2xx
        notify(message, 'error');
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('api-error', handler as EventListener);
    return () => window.removeEventListener('api-error', handler as EventListener);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={5000}
          onClose={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity={notification.type} variant="filled">
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};
