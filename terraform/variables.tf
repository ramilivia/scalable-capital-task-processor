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

variable "db_instance_identifier" {
  description = "Identifier for the RDS instance"
  type        = string
  default     = "tasks-db"
}

variable "db_instance_class" {
  description = "Instance class for the RDS instance"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for the RDS instance in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "tasks_db"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Password for the database"
  type        = string
  default     = "postgres"
  sensitive   = true
}
