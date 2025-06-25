const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const ATTACHMENTS_BUCKET = process.env.ATTACHMENTS_BUCKET;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { httpMethod, pathParameters, requestContext } = event;
    const userId = requestContext.authorizer?.claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    let response;

    switch (httpMethod) {
      case 'POST':
        response = await generatePresignedUrl(userId, pathParameters);
        break;
      
      case 'DELETE':
        response = await deleteFile(userId, pathParameters);
        break;
      
      default:
        response = {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    return {
      ...response,
      headers: { ...corsHeaders, ...response.headers }
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function generatePresignedUrl(userId, pathParameters) {
  const { fileName, fileType } = pathParameters;
  const key = `${userId}/${Date.now()}-${fileName}`;

  const params = {
    Bucket: ATTACHMENTS_BUCKET,
    Key: key,
    ContentType: fileType,
    Expires: 300 // 5 minutes
  };

  const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
  const downloadUrl = `https://${ATTACHMENTS_BUCKET}.s3.amazonaws.com/${key}`;

  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl,
      downloadUrl,
      key
    })
  };
}

async function deleteFile(userId, pathParameters) {
  const { fileKey } = pathParameters;
  
  // Ensure user can only delete their own files
  if (!fileKey.startsWith(`${userId}/`)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden' })
    };
  }

  const params = {
    Bucket: ATTACHMENTS_BUCKET,
    Key: fileKey
  };

  await s3.deleteObject(params).promise();

  return {
    statusCode: 204,
    body: ''
  };
}