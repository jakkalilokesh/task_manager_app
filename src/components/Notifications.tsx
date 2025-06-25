import React from 'react';
import { Bell, Check, CheckCheck, Trash2, Calendar, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';

interface NotificationsProps {
  notifications: any[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ 
  notifications, 
  onMarkAsRead, 
  onClearAll 
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_due':
        return <Calendar className="w-5 h-5 text-orange-600" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_due':
        return 'border-l-orange-500 bg-orange-50';
      case 'reminder':
        return 'border-l-blue-500 bg-blue-50';
      case 'overdue':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h2>
          <p className="text-gray-600">
            Stay updated with your tasks and reminders
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => notifications.filter(n => !n.read).forEach(n => onMarkAsRead(n.id))}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={unreadCount === 0}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </button>
            
            <button
              onClick={onClearAll}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">No notifications</h3>
          <p className="text-gray-400">You're all caught up! New notifications will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 transition-all duration-200 ${
                getNotificationColor(notification.type)
              } ${
                !notification.read ? 'border-r-4 border-r-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {format(new Date(notification.timestamp), 'MMM dd, yyyy • h:mm a')}
                      </span>
                      
                      {notification.data && notification.data.subject && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {notification.data.subject}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Additional notification data */}
              {notification.data && notification.type === 'task_due' && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium">
                      {format(new Date(notification.data.dueDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Priority:</span>
                    <span className={`font-medium ${
                      notification.data.priority === 'HIGH' ? 'text-red-600' :
                      notification.data.priority === 'MEDIUM' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {notification.data.priority}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};