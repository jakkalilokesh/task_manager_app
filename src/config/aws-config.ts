import { Amplify } from 'aws-amplify';

// AWS Configuration - These values will be populated after CloudFormation deployment
const awsConfig = {
  Auth: {
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    userPoolId: process.env.REACT_APP_USER_POOL_ID || '',
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',
    identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID || '',
  },
  API: {
    endpoints: [
      {
        name: 'TasksAPI',
        endpoint: process.env.REACT_APP_API_GATEWAY_URL || '',
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      }
    ]
  },
  Storage: {
    AWSS3: {
      bucket: process.env.REACT_APP_ATTACHMENTS_BUCKET || '',
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    }
  }
};

// Initialize Amplify with AWS configuration
Amplify.configure(awsConfig);

export default awsConfig;