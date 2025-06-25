const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: process.env.AWS_REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        switch (event.typeName) {
            case 'Mutation':
                return await handleMutation(event);
            case 'Query':
                return await handleQuery(event);
            default:
                throw new Error(`Unknown type: ${event.typeName}`);
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

async function handleMutation(event) {
    switch (event.fieldName) {
        case 'sendTaskReminder':
            return await sendTaskReminder(event.arguments.taskId, event.identity);
        case 'generateTaskReport':
            return await generateTaskReport(event.arguments, event.identity);
        case 'bulkUpdateTasks':
            return await bulkUpdateTasks(event.arguments, event.identity);
        default:
            throw new Error(`Unknown mutation: ${event.fieldName}`);
    }
}

async function handleQuery(event) {
    switch (event.fieldName) {
        case 'getTasksByDueDate':
            return await getTasksByDueDate(event.arguments);
        case 'getOverdueTasks':
            return await getOverdueTasks(event.arguments);
        case 'getTasksBySubject':
            return await getTasksBySubject(event.arguments);
        case 'getUserAnalytics':
            return await getUserAnalytics(event.arguments);
        default:
            throw new Error(`Unknown query: ${event.fieldName}`);
    }
}

async function sendTaskReminder(taskId, identity) {
    // Get task details
    const task = await getTaskById(taskId);
    if (!task || task.owner !== identity.username) {
        throw new Error('Task not found or unauthorized');
    }
    
    // Get user profile for email
    const userProfile = await getUserProfile(identity.username);
    
    const emailParams = {
        Destination: {
            ToAddresses: [userProfile.email]
        },
        Message: {
            Body: {
                Html: {
                    Data: `
                        <h2>Task Reminder: ${task.title}</h2>
                        <p><strong>Subject:</strong> ${task.subject}</p>
                        <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
                        <p><strong>Priority:</strong> ${task.priority}</p>
                        ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
                        <p>Don't forget to complete this task!</p>
                    `
                }
            },
            Subject: {
                Data: `Reminder: ${task.title} is due soon`
            }
        },
        Source: process.env.SES_FROM_EMAIL || 'noreply@studenttaskmanager.com'
    };
    
    await ses.sendEmail(emailParams).promise();
    return 'Reminder sent successfully';
}

async function generateTaskReport(args, identity) {
    const { startDate, endDate } = args;
    
    // Query tasks within date range
    const tasks = await getTasksInDateRange(identity.username, startDate, endDate);
    
    const report = {
        period: `${startDate} to ${endDate}`,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
        overdueTasks: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length,
        tasksBySubject: {},
        tasksByPriority: {},
        averageCompletionTime: 0
    };
    
    // Calculate statistics
    tasks.forEach(task => {
        report.tasksBySubject[task.subject] = (report.tasksBySubject[task.subject] || 0) + 1;
        report.tasksByPriority[task.priority] = (report.tasksByPriority[task.priority] || 0) + 1;
    });
    
    // Generate PDF or send email report
    const reportHtml = generateReportHtml(report);
    
    // Send report via email
    const userProfile = await getUserProfile(identity.username);
    const emailParams = {
        Destination: {
            ToAddresses: [userProfile.email]
        },
        Message: {
            Body: {
                Html: { Data: reportHtml }
            },
            Subject: {
                Data: `Your Task Report: ${report.period}`
            }
        },
        Source: process.env.SES_FROM_EMAIL || 'noreply@studenttaskmanager.com'
    };
    
    await ses.sendEmail(emailParams).promise();
    return 'Report generated and sent to your email';
}

async function bulkUpdateTasks(args, identity) {
    const { taskIds, updates } = args;
    const updatedTasks = [];
    
    for (const taskId of taskIds) {
        const task = await getTaskById(taskId);
        if (task && task.owner === identity.username) {
            const updatedTask = await updateTask(taskId, updates);
            updatedTasks.push(updatedTask);
        }
    }
    
    return updatedTasks;
}

async function getTasksByDueDate(args) {
    const params = {
        TableName: process.env.API_STUDENTTASKMANAGER_TASKTABLE_NAME,
        FilterExpression: '#owner = :owner AND #dueDate = :dueDate',
        ExpressionAttributeNames: {
            '#owner': 'owner',
            '#dueDate': 'dueDate'
        },
        ExpressionAttributeValues: {
            ':owner': args.owner,
            ':dueDate': args.dueDate
        }
    };
    
    const result = await dynamodb.scan(params).promise();
    return result.Items;
}

async function getOverdueTasks(args) {
    const now = new Date().toISOString();
    const params = {
        TableName: process.env.API_STUDENTTASKMANAGER_TASKTABLE_NAME,
        FilterExpression: '#owner = :owner AND #dueDate < :now AND #status <> :completed',
        ExpressionAttributeNames: {
            '#owner': 'owner',
            '#dueDate': 'dueDate',
            '#status': 'status'
        },
        ExpressionAttributeValues: {
            ':owner': args.owner,
            ':now': now,
            ':completed': 'COMPLETED'
        }
    };
    
    const result = await dynamodb.scan(params).promise();
    return result.Items;
}

async function getTasksBySubject(args) {
    const params = {
        TableName: process.env.API_STUDENTTASKMANAGER_TASKTABLE_NAME,
        FilterExpression: '#owner = :owner AND #subject = :subject',
        ExpressionAttributeNames: {
            '#owner': 'owner',
            '#subject': 'subject'
        },
        ExpressionAttributeValues: {
            ':owner': args.owner,
            ':subject': args.subject
        }
    };
    
    const result = await dynamodb.scan(params).promise();
    return result.Items;
}

async function getUserAnalytics(args) {
    const tasks = await getAllUserTasks(args.owner);
    
    const analytics = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
        overdueTasks: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length,
        averageCompletionTime: calculateAverageCompletionTime(tasks),
        productivityScore: calculateProductivityScore(tasks)
    };
    
    return analytics;
}

// Helper functions
async function getTaskById(taskId) {
    const params = {
        TableName: process.env.API_STUDENTTASKMANAGER_TASKTABLE_NAME,
        Key: { id: taskId }
    };
    
    const result = await dynamodb.get(params).promise();
    return result.Item;
}

async function getUserProfile(owner) {
    const params = {
        TableName: process.env.API_STUDENTTASKMANAGER_USERPROFILETABLE_NAME,
        Key: { id: owner }
    };
    
    const result = await dynamodb.get(params).promise();
    return result.Item;
}

async function getAllUserTasks(owner) {
    const params = {
        TableName: process.env.API_STUDENTTASKMANAGER_TASKTABLE_NAME,
        FilterExpression: '#owner = :owner',
        ExpressionAttributeNames: {
            '#owner': 'owner'
        },
        ExpressionAttributeValues: {
            ':owner': owner
        }
    };
    
    const result = await dynamodb.scan(params).promise();
    return result.Items;
}

async function getTasksInDateRange(owner, startDate, endDate) {
    const params = {
        TableName: process.env.API_STUDENTTASKMANAGER_TASKTABLE_NAME,
        FilterExpression: '#owner = :owner AND #createdAt BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
            '#owner': 'owner',
            '#createdAt': 'createdAt'
        },
        ExpressionAttributeValues: {
            ':owner': owner,
            ':startDate': startDate,
            ':endDate': endDate
        }
    };
    
    const result = await dynamodb.scan(params).promise();
    return result.Items;
}

function generateReportHtml(report) {
    return `
        <html>
        <body>
            <h1>Task Report</h1>
            <h2>Period: ${report.period}</h2>
            <div>
                <h3>Summary</h3>
                <p>Total Tasks: ${report.totalTasks}</p>
                <p>Completed Tasks: ${report.completedTasks}</p>
                <p>Overdue Tasks: ${report.overdueTasks}</p>
                <p>Completion Rate: ${((report.completedTasks / report.totalTasks) * 100).toFixed(1)}%</p>
            </div>
            <div>
                <h3>Tasks by Subject</h3>
                ${Object.entries(report.tasksBySubject).map(([subject, count]) => 
                    `<p>${subject}: ${count}</p>`
                ).join('')}
            </div>
            <div>
                <h3>Tasks by Priority</h3>
                ${Object.entries(report.tasksByPriority).map(([priority, count]) => 
                    `<p>${priority}: ${count}</p>`
                ).join('')}
            </div>
        </body>
        </html>
    `;
}

function calculateAverageCompletionTime(tasks) {
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED' && t.completedAt);
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
        const created = new Date(task.createdAt);
        const completed = new Date(task.completedAt);
        return sum + (completed.getTime() - created.getTime());
    }, 0);
    
    return totalTime / completedTasks.length / (1000 * 60 * 60 * 24); // Convert to days
}

function calculateProductivityScore(tasks) {
    if (tasks.length === 0) return 0;
    
    const completedOnTime = tasks.filter(t => 
        t.status === 'COMPLETED' && 
        t.completedAt && 
        new Date(t.completedAt) <= new Date(t.dueDate)
    ).length;
    
    return (completedOnTime / tasks.length) * 100;
}