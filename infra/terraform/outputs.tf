# After running `terraform apply`, copy these values into:
# - .env.local (for local development)
# - Hostinger environment variables (for production)

output "s3_bucket_name" {
  description = "Name of the S3 bucket — goes into S3_BUCKET_NAME env var"
  value       = aws_s3_bucket.documents.id
}

output "s3_bucket_region" {
  description = "Region of the S3 bucket — goes into AWS_REGION env var"
  value       = var.aws_region
}

output "app_aws_access_key_id" {
  description = "AWS access key ID for the app — goes into AWS_ACCESS_KEY_ID env var"
  value       = aws_iam_access_key.app.id
  sensitive   = false
}

output "app_aws_secret_access_key" {
  description = "AWS secret key for the app — goes into AWS_SECRET_ACCESS_KEY env var"
  value       = aws_iam_access_key.app.secret
  sensitive   = true # Run: terraform output app_aws_secret_access_key
}

output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role — goes into GitHub secret AWS_ROLE_ARN"
  value       = aws_iam_role.github_actions.arn
}
