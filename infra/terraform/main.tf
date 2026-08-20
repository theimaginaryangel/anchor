terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "anchor-terraform-state-496795891920"
    key    = "anchor/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# Grab the current AWS account ID so we can use it in IAM policies
data "aws_caller_identity" "current" {}
