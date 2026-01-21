  
export default () => ({
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    },
    sqs: {
      queueName: process.env.SQS_QUEUE_NAME || 'task-queue',
      queueUrl: process.env.SQS_QUEUE_URL || 'http://localhost:4566/000000000000/task-queue',
    },
    database: {
      path: process.env.DATABASE_PATH || './tasks.db',
    },
    app: {
      port: parseInt(process.env.PORT || '3000', 10),
      workerPollInterval: parseInt(process.env.WORKER_POLL_INTERVAL || '5000', 10),
    },
  });
  