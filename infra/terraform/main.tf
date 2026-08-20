terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local state is fine for a portfolio project.
  # To use S3 state (recommended for teams), uncomment and fill in:
  #
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "anchor/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

# Grab the current AWS account ID so we can use it in IAM policies
data "aws_caller_identity" "current" {}
