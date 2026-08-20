# GitHub Actions OIDC — lets GitHub Actions authenticate to AWS
# without storing long-lived access keys as GitHub secrets.
#
# How it works:
# 1. GitHub generates a short-lived token for each workflow run
# 2. AWS validates the token against GitHub's OIDC provider
# 3. The workflow assumes this role and gets temporary credentials
# 4. Credentials expire when the job ends

# Register GitHub's OIDC provider with AWS (one-time per account)
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  # GitHub's OIDC thumbprint — this is a fixed value, not a secret
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# The role that GitHub Actions assumes during a workflow run
resource "aws_iam_role" "github_actions" {
  name = "${var.app_name}-github-actions"

  # Trust policy: only allow GitHub Actions from this specific repo
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringLike = {
            # Only allows the main branch and PRs from this repo
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:*"
          }
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Project = var.app_name
  }
}

# What GitHub Actions is allowed to do when it assumes this role.
# Scoped to Terraform operations: managing S3 and IAM for this project.
resource "aws_iam_role_policy" "github_actions" {
  name = "${var.app_name}-github-actions-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # S3 — manage the documents bucket
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = [
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*"
        ]
      },
      # IAM — manage the app user and its policies (for terraform apply)
      {
        Sid    = "IAMAccess"
        Effect = "Allow"
        Action = [
          "iam:GetUser",
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:PutUserPolicy",
          "iam:DeleteUserPolicy",
          "iam:GetUserPolicy",
          "iam:TagUser",
          "iam:GetOpenIDConnectProvider",
          "iam:CreateOpenIDConnectProvider",
          "iam:GetRole",
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:GetRolePolicy",
          "iam:TagRole",
          "iam:PassRole"
        ]
        Resource = "*"
      }
    ]
  })
}
