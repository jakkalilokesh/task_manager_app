# AWS Deployment Guide for Student Task Manager

This guide will help you deploy the Student Task Manager application to AWS using the 5 core services: **S3**, **CloudFront**, **Cognito**, **DynamoDB**, and **Lambda**.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js** (v18 or higher)
4. **jq** command-line JSON processor

## AWS Services Integration

### 1. Amazon S3 (Simple Storage Service)
- **Website Hosting**: Static React application hosting
- **File Storage**: User file attachments and documents
- **Backup Storage**: Application data backups

### 2. Amazon CloudFront (CDN)
- **Global Distribution**: Fast content delivery worldwide
- **HTTPS Termination**: SSL/TLS certificate management
- **Caching**: Improved performance and reduced costs

### 3. Amazon Cognito (Authentication)
- **User Management**: Registration, login, password reset
- **JWT Tokens**: Secure API authentication
- **User Attributes**: Profile information storage

### 4. Amazon DynamoDB (Database)
- **Task Storage**: All task data with user isolation
- **Scalability**: Automatic scaling based on demand
- **Performance**: Single-digit millisecond latency

### 5. AWS Lambda (Serverless Functions)
- **API Endpoints**: RESTful API for task operations
- **File Processing**: Handle file uploads and processing
- **Background Tasks**: Automated notifications and cleanup

## Quick Deployment

### Option 1: Automated Script
```bash
# Make the deployment script executable and run
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Deploy Infrastructure
```bash
aws cloudformation deploy \
  --template-file aws-config/cloudformation-template.yaml \
  --stack-name student-task-manager-prod \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

#### Step 3: Get Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name student-task-manager-prod \
  --query 'Stacks[0].Outputs'
```

#### Step 4: Configure Environment
Create `.env.production` with the stack outputs:
```env
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_CLIENT_ID=your-client-id
REACT_APP_IDENTITY_POOL_ID=your-identity-pool-id
REACT_APP_API_GATEWAY_URL=your-api-gateway-url
REACT_APP_ATTACHMENTS_BUCKET=your-attachments-bucket
```

#### Step 5: Deploy Lambda Functions
```bash
cd aws-config/lambda-functions
zip -r tasks-handler.zip tasks-handler.js
aws lambda update-function-code \
  --function-name student-task-manager-prod-tasks-handler \
  --zip-file fileb://tasks-handler.zip
```

#### Step 6: Build and Deploy Frontend
```bash
npm run build
aws s3 sync build/ s3://your-website-bucket --delete
```

#### Step 7: Invalidate CloudFront Cache
```bash
aws cloudfront create-invalidation \
  --distribution-id your-distribution-id \
  --paths "/*"
```

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   S3 Website     │    │  S3 Attachments │
│   (CDN)         │    │   Bucket         │    │  Bucket         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         │                                               │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │────│   API Gateway    │────│   Lambda        │
│   (Frontend)    │    │   (REST API)     │    │   Functions     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         │                                               │
┌─────────────────┐                              ┌─────────────────┐
│   Cognito       │                              │   DynamoDB      │
│   (Auth)        │                              │   (Database)    │
└─────────────────┘                              └─────────────────┘
```

## Security Features

- **Authentication**: AWS Cognito handles all user authentication
- **Authorization**: JWT tokens for API access
- **Data Isolation**: Users can only access their own data
- **HTTPS**: All traffic encrypted in transit
- **IAM Roles**: Least privilege access for all services

## Monitoring and Logging

- **CloudWatch Logs**: All Lambda function logs
- **CloudWatch Metrics**: Performance monitoring
- **X-Ray Tracing**: Request tracing (optional)
- **CloudTrail**: API call auditing

## Cost Optimization

- **S3 Intelligent Tiering**: Automatic cost optimization
- **Lambda**: Pay per request, no idle costs
- **DynamoDB**: On-demand billing
- **CloudFront**: Edge caching reduces origin requests

## Scaling Considerations

- **Auto Scaling**: DynamoDB and Lambda scale automatically
- **Global Distribution**: CloudFront provides worldwide access
- **High Availability**: Multi-AZ deployment by default

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure API Gateway has proper CORS configuration
2. **Authentication Failures**: Verify Cognito configuration
3. **File Upload Issues**: Check S3 bucket permissions
4. **Lambda Timeouts**: Increase timeout settings if needed

### Debugging Commands

```bash
# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name student-task-manager-prod

# View Lambda function logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/student-task-manager

# Test API endpoints
curl -X GET https://your-api-gateway-url/tasks \
  -H "Authorization: Bearer your-jwt-token"
```

## Maintenance

### Regular Tasks
- Monitor CloudWatch metrics
- Review and rotate access keys
- Update Lambda function dependencies
- Backup DynamoDB data
- Review S3 storage costs

### Updates
- Use blue-green deployments for zero downtime
- Test in staging environment first
- Monitor error rates after deployment

## Support

For issues or questions:
1. Check AWS CloudWatch logs
2. Review AWS documentation
3. Contact AWS support if needed

## Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Security Best Practices](https://aws.amazon.com/security/security-resources/)
- [AWS Cost Optimization](https://aws.amazon.com/aws-cost-management/)