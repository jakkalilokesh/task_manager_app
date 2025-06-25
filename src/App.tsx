import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { record } from '@aws-amplify/analytics';
import awsExports from './aws-exports';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { Account } from './components/Account';
import { StudyTimer } from './components/StudyTimer';
import { Analytics } from './components/Analytics';
import { Notifications } from './components/Notifications';
import { TaskForm } from './components/TaskForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTasks } from './hooks/useTasks';
import { useNotifications } from './hooks/useNotifications';
import { useAnalytics } from './hooks/useAnalytics';
import { Toaster } from 'react-hot-toast';
import '@aws-amplify/ui-react/styles.css';

// Configure Amplify
Amplify.configure(awsExports);
const client = generateClient();

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, refreshTasks } = useTasks();
  const { notifications, markAsRead, clearAll } = useNotifications();
  const { analytics, refreshAnalytics } = useAnalytics();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Record user session
      record({
        name: 'userSession',
        attributes: {
          userId: currentUser.userId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.log('No authenticated user');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, taskId) => {
    try {
      const fileKey = `tasks/${taskId}/${Date.now()}-${file.name}`;
      
      const result = await uploadData({
        key: fileKey,
        data: file,
        options: {
          contentType: file.type,
          metadata: {
            taskId: taskId,
            originalName: file.name
          }
        }
      });

      // Get the file URL
      const fileUrl = await getUrl({ key: fileKey });
      
      return {
        key: fileKey,
        url: fileUrl.url,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleFileDelete = async (fileKey) => {
    try {
      await remove({ key: fileKey });
    } catch (error) {
      console.error('File delete error:', error);
      throw error;
    }
  };

  const handleTaskCreate = async (taskData) => {
    const newTask = await createTask(taskData);
    setShowTaskForm(false);
    setEditingTask(null);
    
    // Record task creation analytics
    record({
      name: 'taskCreated',
      attributes: {
        subject: taskData.subject,
        priority: taskData.priority,
        userId: user.userId
      }
    });
    
    return newTask;
  };

  const handleTaskUpdate = async (taskId, updates) => {
    await updateTask(taskId, updates);
    setShowTaskForm(false);
    setEditingTask(null);
    
    // Record task update analytics
    record({
      name: 'taskUpdated',
      attributes: {
        taskId: taskId,
        status: updates.status,
        userId: user.userId
      }
    });
  };

  const handleTaskDelete = async (taskId) => {
    await deleteTask(taskId);
    
    // Record task deletion analytics
    record({
      name: 'taskDeleted',
      attributes: {
        taskId: taskId,
        userId: user.userId
      }
    });
  };

  const renderCurrentView = () => {
    if (showTaskForm) {
      return (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? 
            (data) => handleTaskUpdate(editingTask.id, data) : 
            handleTaskCreate
          }
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          onFileUpload={handleFileUpload}
          onFileDelete={handleFileDelete}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            tasks={tasks} 
            analytics={analytics}
            onCreateTask={() => setShowTaskForm(true)}
          />
        );
      case 'tasks':
        return (
          <TaskList
            tasks={tasks}
            loading={tasksLoading}
            onCreate={() => setShowTaskForm(true)}
            onEdit={(task) => {
              setEditingTask(task);
              setShowTaskForm(true);
            }}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
            onFileUpload={handleFileUpload}
            onFileDelete={handleFileDelete}
          />
        );
      case 'study-timer':
        return (
          <StudyTimer 
            tasks={tasks}
            onSessionComplete={(sessionData) => {
              // Record study session
              record({
                name: 'studySession',
                attributes: {
                  duration: sessionData.duration,
                  subject: sessionData.subject,
                  userId: user.userId
                }
              });
            }}
          />
        );
      case 'analytics':
        return (
          <Analytics 
            analytics={analytics}
            tasks={tasks}
            onRefresh={refreshAnalytics}
          />
        );
      case 'notifications':
        return (
          <Notifications
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onClearAll={clearAll}
          />
        );
      case 'account':
        return <Account user={user} />;
      default:
        return (
          <Dashboard 
            tasks={tasks} 
            analytics={analytics}
            onCreateTask={() => setShowTaskForm(true)}
          />
        );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <Authenticator
        hideSignUp={false}
        signUpAttributes={['email', 'name']}
        formFields={{
          signUp: {
            email: {
              order: 1,
              placeholder: 'Enter your email address',
              isRequired: true,
            },
            name: {
              order: 2,
              placeholder: 'Enter your full name',
              isRequired: true,
            },
            password: {
              order: 3,
              placeholder: 'Enter your password',
              isRequired: true,
            },
            confirm_password: {
              order: 4,
              placeholder: 'Confirm your password',
              isRequired: true,
            },
          },
        }}
      >
        {({ signOut, user: authUser }) => {
          if (!user && authUser) {
            setUser(authUser);
          }

          return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
              <Header
                user={authUser}
                currentView={currentView}
                onViewChange={setCurrentView}
                onSignOut={signOut}
                notificationCount={notifications.filter(n => !n.read).length}
              />
              
              <main className="pb-8">
                {renderCurrentView()}
              </main>

              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </div>
          );
        }}
      </Authenticator>
    </ErrorBoundary>
  );
}

export default App;