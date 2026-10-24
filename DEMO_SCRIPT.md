# Final Evaluation Demonstration Script (20-Step Mandatory IaC Workflow)

**Project Title:** Automated Deployment of a Serverless Student Task Management Application Using Terraform-Based Infrastructure as Code  
**Target Environment:** Cloudflare Workers, Cloudflare Workers KV, HashiCorp Terraform (Provider v5.x), GitHub Actions CI/CD  
**Purpose:** Step-by-step viva & live demonstration guide with exact CLI commands, click paths, expected terminal outputs, and oral talking points.

---

## 20-Step Live Demonstration Walkthrough

### Step 1: Show Terraform Source Code
* **Action (Click Path):** In your IDE (VS Code / Antigravity), open the `terraform/` folder and show `providers.tf`, `main.tf`, `variables.tf`, and `outputs.tf`.
* **Exact Command / Verification:**
  ```powershell
  Get-ChildItem -Path terraform/*.tf | Select-Object Name
  ```
* **Expected Output:** Files listed: `providers.tf`, `main.tf`, `variables.tf`, `outputs.tf`. Code shows provider `~> 5.0`, `cloudflare_workers_kv_namespace`, `cloudflare_workers_script`, `cloudflare_workers_script_subdomain`, and dynamic outputs without hardcoded tokens.
* **Spoken Explanation (Voice Track):**
  > *"Here is our modular, production-grade Terraform IaC source code. It declaratively defines our Cloudflare Worker, KV NoSQL persistence, bindings, and public subdomain route using Provider version 5, with credentials strictly sourced from environment variables."*

---

### Step 2: Run `terraform validate`
* **Action (Command):**
  ```powershell
  cd terraform
  terraform validate
  ```
* **Expected Output:**
  ```text
  Success! The configuration is valid.
  ```
* **Spoken Explanation (Voice Track):**
  > *"Running terraform validate performs static syntactic and semantic analysis against the Cloudflare provider v5 schema, ensuring all attributes, blocks, and types conform to specifications before execution."*

---

### Step 3: Run `terraform plan`
* **Action (Command):**
  ```powershell
  terraform plan -out=tfplan
  ```
* **Expected Output:**
  ```text
  Terraform will perform the following actions:
    + cloudflare_workers_kv_namespace.student_tasks
    + cloudflare_workers_script.student_task_manager
    + cloudflare_workers_script_subdomain.workers_dev_route

  Plan: 3 to add, 0 to change, 0 to destroy.
  ```
* **Spoken Explanation (Voice Track):**
  > *"Terraform plan compares our desired state against the live Cloudflare infrastructure graph, determining that exactly three new serverless resources need to be provisioned."*

---

### Step 4: Explain Plan Resources
* **Action (Point out in Terminal):** Highlight the three planned resources in the `terraform plan` output:
  1. `cloudflare_workers_kv_namespace.student_tasks`: KV database titled `student_tasks`.
  2. `cloudflare_workers_script.student_task_manager`: Edge Worker script loading `dist/worker.js`, with `TASKS_KV` binding and `ENVIRONMENT` variable.
  3. `cloudflare_workers_script_subdomain.workers_dev_route`: Enables public routing on `*.workers.dev`.
* **Expected Output:** Terminal output displaying attribute configurations for each of the 3 resources.
* **Spoken Explanation (Voice Track):**
  > *"The execution plan details our three infrastructure components: first, a distributed KV namespace for persistent storage; second, our bundled single-file application script bound to that KV; and third, the automatic DNS route enabling access on our workers.dev subdomain."*

---

### Step 5: Run `terraform apply`
* **Action (Command):**
  ```powershell
  terraform apply tfplan
  ```
* **Expected Output:**
  ```text
  Apply complete! Resources: 3 added, 0 changed, 0 destroyed.

  Outputs:
  application_url = "https://student-task-manager.<your-subdomain>.workers.dev"
  kv_namespace_id = "<32-char-kv-id>"
  worker_name = "student-task-manager"
  ```
* **Spoken Explanation (Voice Track):**
  > *"Running terraform apply initiates authenticated REST calls to the Cloudflare API, provisioning our serverless backend, storage, and DNS routing in under 15 seconds."*

---

### Step 6: Show Worker Created in Cloudflare Dashboard
* **Action (Click Path):** Open browser &rarr; Log in to `dash.cloudflare.com` &rarr; Go to **Workers & Pages** &rarr; Overview &rarr; Select `student-task-manager`.
* **Expected Output:** The Worker `student-task-manager` is listed with status `Active`, displaying the deployed URL `https://student-task-manager.<subdomain>.workers.dev` and route `*.workers.dev` enabled.
* **Spoken Explanation (Voice Track):**
  > *"In the Cloudflare dashboard, we verify that Terraform created the Worker service, configured its deployment compatibility date, and assigned its active workers.dev route."*

---

### Step 7: Show KV Namespace Created in Cloudflare Dashboard
* **Action (Click Path):** In Cloudflare Dashboard &rarr; Navigate to **Workers & Pages** &rarr; Select **KV** &rarr; Locate `student_tasks`.
* **Expected Output:** Namespace titled `student_tasks` is visible, with a unique Namespace ID matching the `kv_namespace_id` output printed by Terraform.
* **Spoken Explanation (Voice Track):**
  > *"Navigating to the Workers KV console confirms our distributed NoSQL storage namespace was provisioned strictly through code with the exact title specified in our variables."*

---

### Step 8: Open Deployed Application in Browser
* **Action (Click Path / Command):** In browser, navigate to the `application_url` (e.g. `https://student-task-manager.<your-subdomain>.workers.dev`).
* **Expected Output:** Modern responsive UI renders with the header *"Student Task Manager"*, badge *"Terraform Managed"*, four metrics cards (Total: 0, Pending: 0, Completed: 0, Completion Rate: 0%), and the *"Create New Task"* form.
* **Spoken Explanation (Voice Track):**
  > *"Opening our application URL loads the complete single-page application, served directly from Cloudflare's edge cache with sub-millisecond response times."*

---

### Step 9: Add a Task via UI
* **Action (Click Path):**
  1. Title field: Enter `"Complete Cloud Computing IaC Assignment"`.
  2. Priority dropdown: Select `"High Priority"`.
  3. Status dropdown: Select `"Pending"`.
  4. Click button: **"Add Task"**.
* **Expected Output:**
  - Success toast appears: *"Task T101 created successfully!"*.
  - Task table updates showing ID `T101`, Title, Red `High` badge, Blue `Pending` badge, and timestamp.
  - Metrics cards increment: Total = 1, Pending = 1, Completed = 0, Rate = 0%.
* **Spoken Explanation (Voice Track):**
  > *"Adding a task triggers an asynchronous POST request to /api/tasks. The Worker auto-generates sequential ID T101 and atomically persists the record in Workers KV."*

---

### Step 10: Retrieve Task via cURL API
* **Action (Command):**
  ```powershell
  curl.exe -s "https://student-task-manager.<your-subdomain>.workers.dev/api/tasks/T101"
  ```
* **Expected Output:**
  ```json
  {
    "success": true,
    "data": {
      "id": "T101",
      "title": "Complete Cloud Computing IaC Assignment",
      "priority": "High",
      "status": "Pending",
      "createdDate": "2026-10-24T16:35:00.000Z"
    }
  }
  ```
* **Spoken Explanation (Voice Track):**
  > *"We verify the REST API directly using cURL; the GET endpoint fetches the JSON document directly from Cloudflare KV using our TASKS_KV binding."*

---

### Step 11: Update Task Status
* **Action (Click Path / Command):**
  - In the UI table row for `T101`, click the **"Complete"** button (or via cURL):
  ```powershell
  curl.exe -s -X PUT "https://student-task-manager.<your-subdomain>.workers.dev/api/tasks/T101" -H "Content-Type: application/json" -d '{\"status\":\"Completed\"}'
  ```
* **Expected Output:**
  - Status tag changes to green `Completed`; title gets strikethrough.
  - Metrics cards update: Pending = 0, Completed = 1, Completion Rate = 100% with animated progress bar.
* **Spoken Explanation (Voice Track):**
  > *"Updating the task status issues a PUT request that modifies the persisted JSON in KV and causes our dashboard metrics to recalculate to 100% completion in real time."*

---

### Step 12: Delete Task
* **Action (Click Path / Command):**
  - In the UI table row, click the red **"Delete"** button &rarr; Confirm prompt (or via cURL):
  ```powershell
  curl.exe -s -X DELETE "https://student-task-manager.<your-subdomain>.workers.dev/api/tasks/T101"
  ```
* **Expected Output:**
  - Toast: *"Task T101 deleted"*.
  - Task is removed from the table; empty state illustration appears (*"No Tasks Found"*); metrics reset to 0.
* **Spoken Explanation (Voice Track):**
  > *"Deleting the task invokes the DELETE endpoint, removing the key from Workers KV and restoring the database to a clean empty state."*

---

### Step 13: Modify Terraform Configuration (IaC Change)
* **Action (Code Edit):** Open `terraform/terraform.tfvars` (or edit `default` in `terraform/variables.tf`):
  Change `environment` from `"production"` to `"staging"`.
  ```hcl
  environment = "staging"
  ```
* **Expected Output:** File saved; git diff shows 1 line changed: `- environment = "production"`, `+ environment = "staging"`.
* **Spoken Explanation (Voice Track):**
  > *"To demonstrate the living infrastructure lifecycle, we modify our desired state configuration by updating the environment parameter from production to staging."*

---

### Step 14: Run `terraform plan` Again
* **Action (Command):**
  ```powershell
  terraform plan
  ```
* **Expected Output:**
  ```text
  ~ update in-place

  Terraform will perform the following actions:
    ~ resource "cloudflare_workers_script" "student_task_manager" {
        ~ bindings = [
            ...
            ~ {
                name = "ENVIRONMENT"
              ~ text = "production" -> "staging"
                type = "plain_text"
              },
          ]
      }

  Plan: 0 to add, 1 to change, 0 to destroy.
  ```
* **Spoken Explanation (Voice Track):**
  > *"Running terraform plan calculates the delta between state and configuration, detecting exactly one in-place update without affecting other resources."*

---

### Step 15: Explain Detected Difference
* **Action (Point out in Terminal):** Highlight `~ text = "production" -> "staging"` under `plain_text` binding.
* **Expected Output:** Clear terminal diff highlighting that only the plain-text binding is changing; KV namespace is untouched.
* **Spoken Explanation (Voice Track):**
  > *"Terraform accurately isolates the change to just the ENVIRONMENT variable binding. It guarantees zero data loss because the Workers KV storage namespace is not touched or recreated."*

---

### Step 16: Apply Modification In-Place
* **Action (Command):**
  ```powershell
  terraform apply -auto-approve
  curl.exe -s "https://student-task-manager.<your-subdomain>.workers.dev/api/health"
  ```
* **Expected Output:**
  ```text
  Apply complete! Resources: 0 added, 1 changed, 0 destroyed.
  ```
  Health check returns:
  ```json
  {
    "status": "healthy",
    "app": "student-task-manager",
    "environment": "staging",
    "kvBindingReady": true
  }
  ```
* **Spoken Explanation (Voice Track):**
  > *"The update applies in-place with zero downtime; querying our health check API confirms the live Worker immediately adopted the 'staging' configuration."*

---

### Step 17: Show GitHub Repository
* **Action (Click Path):** Open browser to your GitHub repository page (e.g. `https://github.com/<username>/student-task-manager-iac`).
* **Expected Output:**
  - Clean project structure matching specifications.
  - Complete `README.md` with ASCII architecture diagram and cURL documentation.
  - `.gitignore` actively preventing sensitive `.tfstate` and credential files from entering version control.
* **Spoken Explanation (Voice Track):**
  > *"Here is our GitHub repository demonstrating professional DevOps hygiene: clean modular directory layout, exhaustive documentation, and strict security controls preventing state or secret leakage."*

---

### Step 18: Show GitHub Actions CI/CD Pipeline
* **Action (Click Path):** In GitHub repository &rarr; Click **Actions** tab &rarr; Click latest run of `CI/CD - Build & Deploy Serverless Student Task Manager`.
* **Expected Output:** Pipeline view displaying all green checkmarks:
  - `Checkout Repository`
  - `Setup Node.js Environment`
  - `Build Application Bundle (Inlining Frontend)`
  - `Setup HashiCorp Terraform`
  - `Terraform Init`
  - `Terraform Format Check`
  - `Terraform Validate`
  - `Terraform Plan`
  - `Terraform Apply`
* **Spoken Explanation (Voice Track):**
  > *"Our GitHub Actions workflow delivers continuous deployment. On every git push to main, it bundles our assets, validates Terraform formatting, and applies infrastructure updates automatically."*

---

### Step 19: Run `terraform destroy`
* **Action (Command):**
  ```powershell
  terraform destroy -auto-approve
  ```
* **Expected Output:**
  ```text
  cloudflare_workers_script_subdomain.workers_dev_route: Destroying...
  cloudflare_workers_script.student_task_manager: Destroying...
  cloudflare_workers_kv_namespace.student_tasks: Destroying...

  Destroy complete! Resources: 3 destroyed.
  ```
* **Spoken Explanation (Voice Track):**
  > *"With terraform destroy, we execute a complete, clean teardown of all cloud resources. The route, Worker script, and KV database are dismantled without leaving orphaned resources or ongoing costs."*

---

### Step 20: Recreate Infrastructure (Reproducibility Proof)
* **Action (Command):**
  ```powershell
  terraform apply -auto-approve
  ```
* **Expected Output:**
  ```text
  Apply complete! Resources: 3 added, 0 changed, 0 destroyed.

  Outputs:
  application_url = "https://student-task-manager.<your-subdomain>.workers.dev"
  kv_namespace_id = "<new-kv-id>"
  worker_name = "student-task-manager"
  ```
* **Spoken Explanation (Voice Track):**
  > *"Finally, running apply proves the core promise of Infrastructure as Code: 100% deterministic reproducibility. Our entire serverless stack is restored from code within seconds."*

---

## Required Submission Screenshots Table

Capture and save each screenshot in the `screenshots/` directory using the exact filenames listed below:

| # | Screenshot Filename | Screen / View to Capture | Key Elements Required |
|---|---|---|---|
| **01** | `screenshots/01_terraform_version.png` | Terminal | Output of `terraform version` showing Terraform CLI v1.5+ and Cloudflare Provider v5.x. |
| **02** | `screenshots/02_terraform_source.png` | IDE Editor | Split view of `providers.tf`, `main.tf`, and `variables.tf` showing resource declarations. |
| **03** | `screenshots/03_terraform_validate.png` | Terminal | Output of `terraform validate` displaying `Success! The configuration is valid.`. |
| **04** | `screenshots/04_terraform_plan.png` | Terminal | Output of `terraform plan` showing `Plan: 3 to add, 0 to change, 0 to destroy.`. |
| **05** | `screenshots/05_terraform_apply.png` | Terminal | Output of `terraform apply` showing `Apply complete!` and the 3 output variables. |
| **06** | `screenshots/06_cloudflare_worker.png` | Cloudflare Dashboard | *Workers & Pages > Overview* showing `student-task-manager` Active with workers.dev route. |
| **07** | `screenshots/07_cloudflare_kv.png` | Cloudflare Dashboard | *Workers & Pages > KV* displaying namespace `student_tasks` and matching namespace ID. |
| **08** | `screenshots/08_cloudflare_bindings.png` | Cloudflare Dashboard | *student-task-manager > Settings > Variables* showing `TASKS_KV` binding and `ENVIRONMENT`. |
| **09** | `screenshots/09_app_initial_ui.png` | Web Browser | Live application loaded at `*.workers.dev` displaying 0 tasks, metrics cards, and form. |
| **10** | `screenshots/10_task_created_ui.png` | Web Browser | UI showing task `T101` created with `High` priority, `Pending` status, and Total=1 metric. |
| **11** | `screenshots/11_curl_get_task.png` | Terminal | cURL output for `GET /api/tasks/T101` displaying the JSON record returned from KV. |
| **12** | `screenshots/12_task_completed_ui.png` | Web Browser | UI showing task `T101` marked `Completed` with green badge, strikethrough, and 100% rate. |
| **13** | `screenshots/13_task_deleted_ui.png` | Web Browser | UI after deleting task `T101`, showing empty state illustration and 0 metrics. |
| **14** | `screenshots/14_iac_diff_plan.png` | Terminal | Output of `terraform plan` after changing environment, showing `~ update in-place`. |
| **15** | `screenshots/15_iac_apply_update.png` | Terminal | Output of `terraform apply` showing `0 added, 1 changed, 0 destroyed` and health check. |
| **16** | `screenshots/16_github_repository.png` | Web Browser | GitHub repository main page showing folder structure, clean files, and rendered README. |
| **17** | `screenshots/17_github_secrets.png` | Web Browser | GitHub *Settings > Secrets and variables > Actions* showing `CLOUDFLARE_API_TOKEN` & Account ID. |
| **18** | `screenshots/18_github_actions_run.png` | Web Browser | GitHub Actions tab showing green checkmark and completed steps for the deployment job. |
| **19** | `screenshots/19_terraform_destroy.png` | Terminal | Output of `terraform destroy` showing `Destroy complete! Resources: 3 destroyed.`. |
| **20** | `screenshots/20_terraform_recreate.png` | Terminal | Output of `terraform apply` showing full infrastructure recreation (`3 added`). |

