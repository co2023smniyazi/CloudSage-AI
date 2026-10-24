# ==============================================================================
# Terraform Input Variables Definition
# ==============================================================================

variable "account_id" {
  description = "The Cloudflare Account ID where resources will be provisioned."
  type        = string
  sensitive   = false

  validation {
    condition     = length(var.account_id) == 32 && can(regex("^[a-f0-9]+$", var.account_id))
    error_message = "The account_id must be a valid 32-character hexadecimal Cloudflare Account ID."
  }
}

variable "worker_name" {
  description = "The name of the Cloudflare Worker script and service."
  type        = string
  default     = "student-task-manager"

  validation {
    condition     = can(regex("^[a-z0-9-_]+$", var.worker_name))
    error_message = "The worker_name must consist only of lowercase alphanumeric characters, dashes, or underscores."
  }
}

variable "kv_namespace_name" {
  description = "The title of the Cloudflare Workers KV namespace used for task persistence."
  type        = string
  default     = "student_tasks"
}

variable "environment" {
  description = "Deployment target environment (e.g. production, staging, development)."
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "The environment variable must be one of: 'production', 'staging', or 'development'."
  }
}

variable "workers_subdomain" {
  description = "Optional Cloudflare account workers.dev subdomain prefix (e.g. 'my-account' in 'my-account.workers.dev') to format the final URL."
  type        = string
  default     = ""
}

