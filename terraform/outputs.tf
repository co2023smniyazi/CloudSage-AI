# ==============================================================================
# Terraform Output Variables (Provider v5)
# ==============================================================================

output "worker_name" {
  description = "The deployed Cloudflare Worker script and service name."
  value       = cloudflare_workers_script.student_task_manager.script_name
}

output "kv_namespace_id" {
  description = "The unique identifier of the provisioned Workers KV namespace."
  value       = cloudflare_workers_kv_namespace.student_tasks.id
}

output "application_url" {
  description = "The public HTTPS URL to access the Student Task Management application."
  value = var.workers_subdomain != "" ? (
    "https://${cloudflare_workers_script.student_task_manager.script_name}.${var.workers_subdomain}.workers.dev"
    ) : (
    "https://${cloudflare_workers_script.student_task_manager.script_name}.<your-workers-subdomain>.workers.dev"
  )
}
