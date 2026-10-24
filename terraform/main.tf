# ==============================================================================
# Cloudflare Serverless Infrastructure as Code (Provider v5)
# Resources: Workers KV Namespace, Worker Script, Bindings, Subdomain Route
# ==============================================================================

# 1. Cloudflare Workers KV Namespace
# Distributed, low-latency NoSQL database for student tasks.
resource "cloudflare_workers_kv_namespace" "student_tasks" {
  account_id = var.account_id
  title      = var.kv_namespace_name
}

# 2. Cloudflare Worker Script (v5 Syntax)
# Deploys the bundled single-file application containing both API and Frontend.
resource "cloudflare_workers_script" "student_task_manager" {
  account_id         = var.account_id
  script_name        = var.worker_name
  content            = file("${path.module}/../dist/worker.js")
  main_module        = "worker.js"
  compatibility_date = "2024-09-23"

  # Bindings in v5: list of objects for KV namespaces and environment variables
  bindings = [
    {
      type         = "kv_namespace"
      name         = "TASKS_KV"
      namespace_id = cloudflare_workers_kv_namespace.student_tasks.id
    },
    {
      type = "plain_text"
      name = "ENVIRONMENT"
      text = var.environment
    }
  ]
}

# 3. Workers.dev Subdomain Route Enablement (v5 Syntax)
# Automatically activates the public *.workers.dev route for the deployed Worker.
resource "cloudflare_workers_script_subdomain" "workers_dev_route" {
  account_id  = var.account_id
  script_name = cloudflare_workers_script.student_task_manager.script_name
  enabled     = true
}
