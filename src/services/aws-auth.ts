import { Auth } from 'aws-amplify';
import { User } from '../types';

export class AWSAuthService {
  static async signUp(email: string, password: string, name: string): Promise<any> {
    try {
      const result = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          name,
        },
      });
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  static async confirmSignUp(email: string, code: string): Promise<any> {
    try {
      const result = await Auth.confirmSignUp(email, code);
      return result;
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw error;
    }
  }

  static async signIn(email: string, password: string): Promise<User> {
    try {
      const cognitoUser = await Auth.signIn(email, password);
      const userAttributes = await Auth.userAttributes(cognitoUser);
      
      const user: User = {
        id: cognitoUser.attributes.sub,
        email: cognitoUser.attributes.email,
        name: cognitoUser.attributes.name,
        created_at: cognitoUser.attributes.created_at || new Date().toISOString(),
        last_login: new Date().toISOString()
      };
      
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await Auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const cognitoUser = await Auth.currentAuthenticatedUser();
      const userAttributes = await Auth.userAttributes(cognitoUser);
      
      const attributesMap = userAttributes.reduce((acc: any, attr: any) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {});
      
      const user: User = {
        id: attributesMap.sub,
        email: attributesMap.email,
        name: attributesMap.name,
        created_at: attributesMap.created_at || new Date().toISOString(),
        last_login: new Date().toISOString()
      };
      
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async getJwtToken(): Promise<string | null> {
    try {
      const session = await Auth.currentSession();
      return session.getIdToken().getJwtToken();
    } catch (error) {
      console.error('Get JWT token error:', error);
      return null;
    }
  }
}