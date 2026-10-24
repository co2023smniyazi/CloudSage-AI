# ==============================================================================
# Terraform Providers & Remote State Configuration
# Project: Automated Deployment of Serverless Student Task Management Application
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  # HCP Terraform (Terraform Cloud) Remote State Backend
  cloud {
    organization = "MY_HCP_ORG"

    workspaces {
      name = "student-task-manager"
    }
  }

  # Official Cloudflare Terraform Provider pinned to v5.x release
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

# Cloudflare Provider configuration
# Authentication credentials are NEVER hardcoded.
# The provider automatically authenticates using the CLOUDFLARE_API_TOKEN environment variable.
provider "cloudflare" {
  # api_token is sourced directly from CLOUDFLARE_API_TOKEN env var.
}
