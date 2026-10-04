import React, { useEffect } from 'react';
import { notificationsEnabled, startNotificationScheduler } from '../../services/notificationService';

export const NotificationScheduler: React.FC = () => {
  useEffect(() => {
    if (!notificationsEnabled()) return;
    return startNotificationScheduler();
  }, []);
  return null;
};
