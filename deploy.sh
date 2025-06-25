#!/bin/bash

# AWS Deployment Script for Student Task Manager
set -e

# Configuration
PROJECT_NAME="student-task-manager"
ENVIRONMENT="prod"
AWS_REGION="us-east-1"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

echo "🚀 Starting AWS deployment for ${PROJECT_NAME}..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured successfully"

# Deploy CloudFormation stack
echo "📦 Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file aws-config/cloudformation-template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        ProjectName=$PROJECT_NAME \
        Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION

echo "✅ CloudFormation stack deployed successfully"

# Get stack outputs
echo "📋 Retrieving stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs' \
    --output json)

# Extract values from outputs
USER_POOL_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolId") | .OutputValue')
USER_POOL_CLIENT_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolClientId") | .OutputValue')
IDENTITY_POOL_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="IdentityPoolId") | .OutputValue')
API_GATEWAY_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue')
WEBSITE_BUCKET=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="WebsiteBucketName") | .OutputValue')
ATTACHMENTS_BUCKET=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="AttachmentsBucketName") | .OutputValue')
CLOUDFRONT_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="WebsiteURL") | .OutputValue')

# Create environment file
echo "📝 Creating environment configuration..."
cat > .env.production << EOF
REACT_APP_AWS_REGION=$AWS_REGION
REACT_APP_USER_POOL_ID=$USER_POOL_ID
REACT_APP_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
REACT_APP_IDENTITY_POOL_ID=$IDENTITY_POOL_ID
REACT_APP_API_GATEWAY_URL=$API_GATEWAY_URL
REACT_APP_ATTACHMENTS_BUCKET=$ATTACHMENTS_BUCKET
EOF

echo "✅ Environment file created"

# Package and deploy Lambda functions
echo "📦 Packaging Lambda functions..."
cd aws-config/lambda-functions

# Package tasks handler
zip -r tasks-handler.zip tasks-handler.js
aws lambda update-function-code \
    --function-name "${PROJECT_NAME}-${ENVIRONMENT}-tasks-handler" \
    --zip-file fileb://tasks-handler.zip \
    --region $AWS_REGION

# Package file upload handler
zip -r file-upload-handler.zip file-upload-handler.js
aws lambda update-function-code \
    --function-name "${PROJECT_NAME}-${ENVIRONMENT}-file-upload-handler" \
    --zip-file fileb://file-upload-handler.zip \
    --region $AWS_REGION

cd ../..

echo "✅ Lambda functions deployed"

# Build and deploy React application
echo "🏗️ Building React application..."
npm run build

echo "📤 Uploading to S3..."
aws s3 sync build/ s3://$WEBSITE_BUCKET --delete --region $AWS_REGION

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Origins.Items[0].DomainName=='${WEBSITE_BUCKET}.s3.amazonaws.com'].Id" \
    --output text \
    --region $AWS_REGION)

if [ ! -z "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" \
        --region $AWS_REGION
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Website URL: https://$CLOUDFRONT_URL"
echo "   API Gateway URL: $API_GATEWAY_URL"
echo "   User Pool ID: $USER_POOL_ID"
echo "   User Pool Client ID: $USER_POOL_CLIENT_ID"
echo ""
echo "🔧 Next Steps:"
echo "1. Update your DNS records to point to the CloudFront distribution"
echo "2. Configure custom domain if needed"
echo "3. Set up monitoring and alerts in CloudWatch"
echo "4. Test all functionality in the deployed environment"