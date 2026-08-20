# S3 bucket for storing uploaded PDFs.
# Textract reads directly from here, so the app never has to
# stream the file through the Next.js server.

resource "aws_s3_bucket" "documents" {
  bucket = var.bucket_name

  tags = {
    Project = var.app_name
  }
}

# Block all public access. Documents are private.
# The app accesses them using IAM credentials, not public URLs.
resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CORS config so the browser can upload directly to S3 from the frontend.
# Restricts origins to the app domain only.
resource "aws_s3_bucket_cors_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = [
      "http://localhost:3000",
      "https://anchor.bennyduah.com"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Server-side encryption. Encrypts documents at rest using AWS-managed keys.
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
