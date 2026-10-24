# ==============================================================================
# Terraform Providers & Remote State Configuration
# Project: Automated Deployment of Serverless Student Task Management Application
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  # Official Cloudflare Terraform Provider pinned to v5.x release
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # ----------------------------------------------------------------------------
  # Remote State Backend: HCP Terraform (Terraform Cloud)
  # Ephemeral CI/CD runners (like GitHub Actions) do not persist local state.
  # Remote backend ensures team collaboration, state locking, and durability.
  # Workspace execution mode must be set to "local" so runners execute commands.
  # ----------------------------------------------------------------------------
  # Note: To enable remote state, uncomment this block and set your HCP organization:
  # cloud {
  #   organization = "your-hcp-organization-name"
  #   workspaces {
  #     name = "student-task-manager-iac"
  #   }
  # }
}

# Cloudflare Provider configuration
# Authentication credentials are NEVER hardcoded.
# The provider automatically authenticates using the CLOUDFLARE_API_TOKEN environment variable.
provider "cloudflare" {
  # api_token is sourced directly from CLOUDFLARE_API_TOKEN env var.
}
