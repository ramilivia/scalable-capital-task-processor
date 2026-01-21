output "queue_url" {
  description = "URL of the SQS queue"
  value       = aws_sqs_queue.task_queue.url
}

output "queue_name" {
  description = "Name of the SQS queue"
  value       = aws_sqs_queue.task_queue.name
}

output "queue_arn" {
  description = "ARN of the SQS queue"
  value       = aws_sqs_queue.task_queue.arn
}

# RDS outputs - uncomment when deploying to AWS
# output "db_instance_endpoint" {
#   description = "RDS instance endpoint"
#   value       = aws_db_instance.tasks_db.endpoint
# }
#
# output "db_instance_address" {
#   description = "RDS instance address"
#   value       = aws_db_instance.tasks_db.address
# }
#
# output "db_instance_port" {
#   description = "RDS instance port"
#   value       = aws_db_instance.tasks_db.port
# }
