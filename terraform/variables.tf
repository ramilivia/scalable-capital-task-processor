variable "aws_region" {
  description = "AWS region (used for LocalStack)"
  type        = string
  default     = "us-east-1"
}

variable "localstack_endpoint" {
  description = "LocalStack endpoint URL"
  type        = string
  default     = "http://localhost:4566"
}

variable "queue_name" {
  description = "Name of the SQS queue"
  type        = string
  default     = "task-queue"
}

variable "visibility_timeout" {
  description = "The visibility timeout for the queue in seconds"
  type        = number
  default     = 300
}

variable "message_retention_period" {
  description = "The number of seconds to retain messages in the queue"
  type        = number
  default     = 86400
}
