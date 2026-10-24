# Evaluation Screenshots Directory

This directory stores the official 20 screenshots required for project evaluation and viva defense.

Each filename corresponds directly to the steps in [DEMO_SCRIPT.md](../DEMO_SCRIPT.md):

| # | Filename | Description |
|---|---|---|
| 01 | `01_terraform_version.png` | `terraform version` showing Terraform CLI v1.5+ and Cloudflare Provider v5.x |
| 02 | `02_terraform_source.png` | IDE showing `providers.tf`, `main.tf`, and `variables.tf` |
| 03 | `03_terraform_validate.png` | Terminal showing `terraform validate` (`Success! The configuration is valid.`) |
| 04 | `04_terraform_plan.png` | Terminal showing `terraform plan` (`Plan: 3 to add, 0 to change, 0 to destroy.`) |
| 05 | `05_terraform_apply.png` | Terminal showing `terraform apply` completed with outputs |
| 06 | `06_cloudflare_worker.png` | Cloudflare Dashboard: Worker `student-task-manager` Active with route |
| 07 | `07_cloudflare_kv.png` | Cloudflare Dashboard: KV namespace `student_tasks` created |
| 08 | `08_cloudflare_bindings.png` | Cloudflare Dashboard: Worker Settings showing `TASKS_KV` & `ENVIRONMENT` |
| 09 | `09_app_initial_ui.png` | Web application running at `*.workers.dev` in initial empty state |
| 10 | `10_task_created_ui.png` | UI showing task `T101` added with High priority & Pending status |
| 11 | `11_curl_get_task.png` | Terminal showing `curl GET /api/tasks/T101` JSON response |
| 12 | `12_task_completed_ui.png` | UI showing task `T101` completed with 100% completion rate |
| 13 | `13_task_deleted_ui.png` | UI showing task deleted and reset to empty state |
| 14 | `14_iac_diff_plan.png` | Terminal showing `terraform plan` detecting environment modification |
| 15 | `15_iac_apply_update.png` | Terminal showing `terraform apply` in-place update and `/api/health` test |
| 16 | `16_github_repository.png` | GitHub repository showing structure, README, and clean security hygiene |
| 17 | `17_github_secrets.png` | GitHub repository Settings showing configured Actions secrets |
| 18 | `18_github_actions_run.png` | GitHub Actions pipeline run showing green checkmarks on all steps |
| 19 | `19_terraform_destroy.png` | Terminal showing `terraform destroy` tearing down all 3 resources |
| 20 | `20_terraform_recreate.png` | Terminal showing `terraform apply` restoring all infrastructure |
