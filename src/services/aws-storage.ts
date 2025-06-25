import { Storage } from 'aws-amplify';

export class AWSStorageService {
  static async uploadFile(file: File, key?: string): Promise<string> {
    try {
      const fileKey = key || `${Date.now()}-${file.name}`;
      const result = await Storage.put(fileKey, file, {
        contentType: file.type,
        level: 'private' // User-specific storage
      });
      return result.key;
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  static async getFileUrl(key: string): Promise<string> {
    try {
      const url = await Storage.get(key, {
        level: 'private',
        expires: 3600 // 1 hour
      });
      return url as string;
    } catch (error) {
      console.error('Get file URL error:', error);
      throw error;
    }
  }

  static async deleteFile(key: string): Promise<void> {
    try {
      await Storage.remove(key, {
        level: 'private'
      });
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  static async listFiles(prefix?: string): Promise<any[]> {
    try {
      const result = await Storage.list(prefix || '', {
        level: 'private'
      });
      return result.results || [];
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }
}