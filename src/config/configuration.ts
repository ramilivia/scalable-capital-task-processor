  
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
      type: 'postgres',
      // For LocalStack RDS, the endpoint will be provided by Terraform outputs
      // Default to localhost:5432 for LocalStack RDS (LocalStack typically exposes on 5432)
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'tasks_db',
      synchronize: process.env.DB_SYNCHRONIZE === 'true' || true, // Auto-create tables in dev
      logging: process.env.DB_LOGGING === 'true' || false,
    },
    app: {
      port: parseInt(process.env.PORT || '3000', 10),
      workerPollInterval: parseInt(process.env.WORKER_POLL_INTERVAL || '5000', 10),
    },
  });
  