# Terraform README
#
# This folder provisions the AWS infrastructure for Anchor.
#
# Resources created:
#   - S3 bucket for document storage (private, encrypted)
#   - IAM user for the app (S3, Textract, Bedrock permissions)
#   - GitHub Actions OIDC role (for CI/CD without stored AWS keys)
#
# What is NOT managed here (done manually):
#   - Bedrock model access (enable in AWS console: Bedrock → Model access → Titan Embeddings G1)
#   - Supabase database setup (Supabase dashboard)
#   - Hostinger hosting (Hostinger control panel)

## Prerequisites

1. Install Terraform: https://developer.hashicorp.com/terraform/install
2. Configure AWS credentials locally:
   ```bash
   aws configure
   # Enter your AWS access key, secret key, and region (us-east-1)
   ```

## First-time setup

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

After `apply` completes, get your app credentials:
```bash
terraform output app_aws_access_key_id
terraform output app_aws_secret_access_key  # sensitive, shows value
```

Copy those into `.env.local` under `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

## GitHub Actions setup

After `apply`, add these secrets to your GitHub repo
(Settings → Secrets and variables → Actions → New repository secret):

| Secret name | Value |
|---|---|
| `AWS_ROLE_ARN` | value of `terraform output github_actions_role_arn` |
| `NEXTAUTH_URL` | `https://anchor.bennyduah.com` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | your Entra ID client ID |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | your Entra ID client secret |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | your Entra ID issuer URL |
| `NEXTAUTH_SECRET` | your NextAuth secret |
| `GEMINI_API_KEY` | your Gemini API key |
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service role key |

## Updating infrastructure

Make changes to the `.tf` files, then:
```bash
terraform plan   # preview changes
terraform apply  # apply changes
```
