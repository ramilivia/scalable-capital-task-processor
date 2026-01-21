terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  access_key                  = "test"
  secret_key                  = "test"
  region                      = var.aws_region
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
  
  endpoints {
    sqs = var.localstack_endpoint
    # RDS is not available in LocalStack free tier, using docker-compose postgres for local dev
    # rds = var.localstack_endpoint
  }
}

# Dead Letter Queue for failed tasks (after 3 retries)
resource "aws_sqs_queue" "failed_queue" {
  name                      = "${var.queue_name}-failed"
  message_retention_seconds = var.message_retention_period
  
  tags = {
    Environment = "local"
    ManagedBy   = "terraform"
  }
}

resource "aws_sqs_queue" "task_queue" {
  name                      = var.queue_name
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds  = var.message_retention_period
  
  # Configure Dead Letter Queue - move messages here after 3 failed attempts
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.failed_queue.arn
    maxReceiveCount     = 3
  })
  
  tags = {
    Environment = "local"
    ManagedBy   = "terraform"
  }
}

# RDS instance - for production AWS deployment
# Note: LocalStack free tier doesn't support RDS, so for local development
# we use the PostgreSQL container in docker-compose.yml
# Uncomment and configure for production AWS deployment:
#
# resource "aws_db_instance" "tasks_db" {
#   identifier     = var.db_instance_identifier
#   engine         = "postgres"
#   engine_version = "15"
#   instance_class = var.db_instance_class
#   allocated_storage = var.db_allocated_storage
#   storage_type   = "gp2"
#   
#   db_name  = var.db_name
#   username = var.db_username
#   password = var.db_password
#   
#   publicly_accessible = true
#   skip_final_snapshot = true
#   
#   tags = {
#     Environment = "production"
#     ManagedBy   = "terraform"
#   }
# }
