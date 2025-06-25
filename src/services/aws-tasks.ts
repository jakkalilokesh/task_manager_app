import { API } from 'aws-amplify';
import { Task } from '../types';
import { AWSAuthService } from './aws-auth';

export class AWSTasksService {
  private static apiName = 'TasksAPI';

  static async getTasks(): Promise<Task[]> {
    try {
      const token = await AWSAuthService.getJwtToken();
      const response = await API.get(this.apiName, '/tasks', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response;
    } catch (error) {
      console.error('Get tasks error:', error);
      throw error;
    }
  }

  static async getTask(taskId: string): Promise<Task> {
    try {
      const token = await AWSAuthService.getJwtToken();
      const response = await API.get(this.apiName, `/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response;
    } catch (error) {
      console.error('Get task error:', error);
      throw error;
    }
  }

  static async createTask(taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task> {
    try {
      const token = await AWSAuthService.getJwtToken();
      const response = await API.post(this.apiName, '/tasks', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: taskData
      });
      return response;
    } catch (error) {
      console.error('Create task error:', error);
      throw error;
    }
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const token = await AWSAuthService.getJwtToken();
      const response = await API.put(this.apiName, `/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: updates
      });
      return response;
    } catch (error) {
      console.error('Update task error:', error);
      throw error;
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      const token = await AWSAuthService.getJwtToken();
      await API.del(this.apiName, `/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Delete task error:', error);
      throw error;
    }
  }
}