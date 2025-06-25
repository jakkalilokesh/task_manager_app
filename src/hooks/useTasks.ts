import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import toast from 'react-hot-toast';

const client = generateClient();

const LIST_TASKS = `
  query ListTasks($filter: ModelTaskFilterInput, $limit: Int, $nextToken: String) {
    listTasks(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        description
        subject
        priority
        status
        dueDate
        tags
        estimatedHours
        actualHours
        completedAt
        createdAt
        updatedAt
        attachments {
          items {
            id
            fileName
            fileSize
            fileType
            fileKey
            uploadedAt
          }
        }
        reminders {
          items {
            id
            reminderDate
            reminderType
            message
            sent
          }
        }
      }
      nextToken
    }
  }
`;

const CREATE_TASK = `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      description
      subject
      priority
      status
      dueDate
      tags
      estimatedHours
      actualHours
      completedAt
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_TASK = `
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      id
      title
      description
      subject
      priority
      status
      dueDate
      tags
      estimatedHours
      actualHours
      completedAt
      createdAt
      updatedAt
    }
  }
`;

const DELETE_TASK = `
  mutation DeleteTask($input: DeleteTaskInput!) {
    deleteTask(input: $input) {
      id
    }
  }
`;

const GET_OVERDUE_TASKS = `
  query GetOverdueTasks($owner: String!) {
    getOverdueTasks(owner: $owner) {
      id
      title
      subject
      priority
      dueDate
      status
    }
  }
`;

const SEND_TASK_REMINDER = `
  mutation SendTaskReminder($taskId: ID!) {
    sendTaskReminder(taskId: $taskId)
  }
`;

const GENERATE_TASK_REPORT = `
  mutation GenerateTaskReport($startDate: AWSDateTime!, $endDate: AWSDateTime!) {
    generateTaskReport(startDate: $startDate, endDate: $endDate)
  }
`;

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await getCurrentUser();
      const result = await client.graphql({
        query: LIST_TASKS,
        variables: {
          filter: {
            owner: { eq: user.userId }
          },
          limit: 100
        }
      });
      
      setTasks(result.data.listTasks.items);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData) => {
    try {
      const user = await getCurrentUser();
      const input = {
        ...taskData,
        owner: user.userId,
        status: taskData.status || 'PENDING',
        priority: taskData.priority || 'MEDIUM',
        dueDate: taskData.dueDate || new Date().toISOString(),
        tags: taskData.tags || [],
        estimatedHours: taskData.estimatedHours || 0
      };

      const result = await client.graphql({
        query: CREATE_TASK,
        variables: { input }
      });

      const newTask = result.data.createTask;
      setTasks(prev => [newTask, ...prev]);
      toast.success('Task created successfully!');
      return newTask;
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error('Failed to create task');
      throw err;
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const input = {
        id: taskId,
        ...updates
      };

      // If marking as completed, set completedAt timestamp
      if (updates.status === 'COMPLETED' && !updates.completedAt) {
        input.completedAt = new Date().toISOString();
      }

      const result = await client.graphql({
        query: UPDATE_TASK,
        variables: { input }
      });

      const updatedTask = result.data.updateTask;
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      
      toast.success('Task updated successfully!');
      return updatedTask;
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await client.graphql({
        query: DELETE_TASK,
        variables: { input: { id: taskId } }
      });

      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully!');
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
      throw err;
    }
  };

  const getOverdueTasks = async () => {
    try {
      const user = await getCurrentUser();
      const result = await client.graphql({
        query: GET_OVERDUE_TASKS,
        variables: { owner: user.userId }
      });
      
      return result.data.getOverdueTasks;
    } catch (err) {
      console.error('Error fetching overdue tasks:', err);
      return [];
    }
  };

  const sendTaskReminder = async (taskId) => {
    try {
      const result = await client.graphql({
        query: SEND_TASK_REMINDER,
        variables: { taskId }
      });
      
      toast.success('Reminder sent successfully!');
      return result.data.sendTaskReminder;
    } catch (err) {
      console.error('Error sending reminder:', err);
      toast.error('Failed to send reminder');
      throw err;
    }
  };

  const generateReport = async (startDate, endDate) => {
    try {
      const result = await client.graphql({
        query: GENERATE_TASK_REPORT,
        variables: { startDate, endDate }
      });
      
      toast.success('Report generated and sent to your email!');
      return result.data.generateTaskReport;
    } catch (err) {
      console.error('Error generating report:', err);
      toast.error('Failed to generate report');
      throw err;
    }
  };

  const refreshTasks = () => {
    fetchTasks();
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    getOverdueTasks,
    sendTaskReminder,
    generateReport,
    refreshTasks
  };
};