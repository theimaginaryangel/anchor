# IAM user that the Next.js app uses to call AWS services.
# Its access key goes into NEXTAUTH_URL and friends in .env.local / Hostinger env vars.

resource "aws_iam_user" "app" {
  name = "${var.app_name}-app"

  tags = {
    Project = var.app_name
  }
}

# Access key for the app user.
# Terraform stores this in state — treat state like a secret.
resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}

# Policy: what the app user is allowed to do.
# S3: read and write to the documents bucket only.
# Textract: start and poll jobs.
# Bedrock: invoke the Titan Embeddings model only.
resource "aws_iam_user_policy" "app" {
  name = "${var.app_name}-app-policy"
  user = aws_iam_user.app.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # S3 — read/write/delete within the documents bucket
      {
        Sid    = "S3DocumentAccess"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*"
        ]
      },
      # Textract — start async jobs and poll results
      {
        Sid    = "TextractAccess"
        Effect = "Allow"
        Action = [
          "textract:StartDocumentTextDetection",
          "textract:GetDocumentTextDetection",
          "textract:StartDocumentAnalysis",
          "textract:GetDocumentAnalysis"
        ]
        Resource = "*"
      },
      # Bedrock — invoke Titan Embeddings G1 only
      {
        Sid    = "BedrockEmbeddingsAccess"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.titan-embed-text-v1"
      }
    ]
  })
}
