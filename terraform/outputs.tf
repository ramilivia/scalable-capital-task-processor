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
