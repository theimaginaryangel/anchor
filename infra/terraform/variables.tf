variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "Name of the S3 bucket that stores uploaded documents"
  type        = string
  default     = "anchor-documents-496795891920"
}

variable "app_name" {
  description = "Short name used to prefix IAM resources"
  type        = string
  default     = "anchor"
}

variable "github_repo" {
  description = "GitHub repo in owner/name format — used to scope the OIDC trust policy"
  type        = string
  default     = "theimaginaryangel/anchor"
}
