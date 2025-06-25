import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient();

const GET_USER_ANALYTICS = `
  query GetUserAnalytics($owner: String!) {
    getUserAnalytics(owner: $owner) {
      totalTasks
      completedTasks
      overdueTasks
      averageCompletionTime
      productivityScore
    }
  }
`;

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    averageCompletionTime: 0,
    productivityScore: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    
    try {
      const user = await getCurrentUser();
      const result = await client.graphql({
        query: GET_USER_ANALYTICS,
        variables: { owner: user.userId }
      });
      
      setAnalytics(result.data.getUserAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = () => {
    fetchAnalytics();
  };

  return {
    analytics,
    loading,
    refreshAnalytics
  };
};