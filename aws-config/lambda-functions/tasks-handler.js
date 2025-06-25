const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const TASKS_TABLE = process.env.TASKS_TABLE;
const ATTACHMENTS_BUCKET = process.env.ATTACHMENTS_BUCKET;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { httpMethod, pathParameters, body, requestContext } = event;
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
      case 'GET':
        if (pathParameters?.taskId) {
          response = await getTask(userId, pathParameters.taskId);
        } else {
          response = await getTasks(userId);
        }
        break;
      
      case 'POST':
        response = await createTask(userId, JSON.parse(body));
        break;
      
      case 'PUT':
        response = await updateTask(userId, pathParameters.taskId, JSON.parse(body));
        break;
      
      case 'DELETE':
        response = await deleteTask(userId, pathParameters.taskId);
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

async function getTasks(userId) {
  const params = {
    TableName: TASKS_TABLE,
    KeyConditionExpression: 'user_id = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };

  const result = await dynamodb.query(params).promise();
  
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items)
  };
}

async function getTask(userId, taskId) {
  const params = {
    TableName: TASKS_TABLE,
    Key: {
      user_id: userId,
      task_id: taskId
    }
  };

  const result = await dynamodb.get(params).promise();
  
  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Task not found' })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result.Item)
  };
}

async function createTask(userId, taskData) {
  const taskId = generateTaskId();
  const timestamp = new Date().toISOString();
  
  const task = {
    user_id: userId,
    task_id: taskId,
    ...taskData,
    created_at: timestamp,
    updated_at: timestamp
  };

  const params = {
    TableName: TASKS_TABLE,
    Item: task
  };

  await dynamodb.put(params).promise();
  
  return {
    statusCode: 201,
    body: JSON.stringify(task)
  };
}

async function updateTask(userId, taskId, updates) {
  const timestamp = new Date().toISOString();
  
  const updateExpression = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  
  Object.keys(updates).forEach(key => {
    if (key !== 'user_id' && key !== 'task_id') {
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = updates[key];
    }
  });
  
  updateExpression.push('#updated_at = :updated_at');
  expressionAttributeNames['#updated_at'] = 'updated_at';
  expressionAttributeValues[':updated_at'] = timestamp;

  const params = {
    TableName: TASKS_TABLE,
    Key: {
      user_id: userId,
      task_id: taskId
    },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };

  const result = await dynamodb.update(params).promise();
  
  return {
    statusCode: 200,
    body: JSON.stringify(result.Attributes)
  };
}

async function deleteTask(userId, taskId) {
  const params = {
    TableName: TASKS_TABLE,
    Key: {
      user_id: userId,
      task_id: taskId
    }
  };

  await dynamodb.delete(params).promise();
  
  return {
    statusCode: 204,
    body: ''
  };
}

function generateTaskId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}