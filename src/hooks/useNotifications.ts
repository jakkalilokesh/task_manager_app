import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient();

const TASK_DUE_SUBSCRIPTION = `
  subscription OnTaskDue($owner: String!) {
    onTaskDue(owner: $owner) {
      id
      title
      subject
      dueDate
      priority
    }
  }
`;

const REMINDER_SENT_SUBSCRIPTION = `
  subscription OnReminderSent($owner: String!) {
    onReminderSent(owner: $owner) {
      id
      message
      reminderDate
      task {
        id
        title
        subject
      }
    }
  }
`;

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setupSubscriptions();
    loadStoredNotifications();
  }, []);

  const setupSubscriptions = async () => {
    try {
      const user = await getCurrentUser();
      
      // Subscribe to task due notifications
      const taskDueSubscription = client.graphql({
        query: TASK_DUE_SUBSCRIPTION,
        variables: { owner: user.userId }
      }).subscribe({
        next: ({ data }) => {
          const task = data.onTaskDue;
          addNotification({
            id: `task-due-${task.id}`,
            type: 'task_due',
            title: 'Task Due Soon',
            message: `"${task.title}" is due soon`,
            data: task,
            timestamp: new Date().toISOString(),
            read: false
          });
        },
        error: (err) => console.error('Task due subscription error:', err)
      });

      // Subscribe to reminder notifications
      const reminderSubscription = client.graphql({
        query: REMINDER_SENT_SUBSCRIPTION,
        variables: { owner: user.userId }
      }).subscribe({
        next: ({ data }) => {
          const reminder = data.onReminderSent;
          addNotification({
            id: `reminder-${reminder.id}`,
            type: 'reminder',
            title: 'Task Reminder',
            message: reminder.message || `Reminder for "${reminder.task.title}"`,
            data: reminder,
            timestamp: new Date().toISOString(),
            read: false
          });
        },
        error: (err) => console.error('Reminder subscription error:', err)
      });

      // Cleanup subscriptions on unmount
      return () => {
        taskDueSubscription.unsubscribe();
        reminderSubscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up subscriptions:', error);
    }
  };

  const loadStoredNotifications = () => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      setNotifications(JSON.parse(stored));
    }
  };

  const saveNotifications = (notifs) => {
    localStorage.setItem('notifications', JSON.stringify(notifs));
  };

  const addNotification = (notification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 50); // Keep only last 50
      saveNotifications(updated);
      return updated;
    });

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      saveNotifications(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      saveNotifications(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  return {
    notifications,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestNotificationPermission
  };
};