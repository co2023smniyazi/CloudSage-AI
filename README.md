# Automated Deployment of a Serverless Student Task Management Application Using Terraform-Based Infrastructure as Code

[![Terraform](https://img.shields.io/badge/Terraform-1.5%2B-623CE4?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Cloudflare Provider](https://img.shields.io/badge/Cloudflare_Provider-v5.x-F38020?logo=cloudflare&logoColor=white)](https://registry.terraform.io/providers/cloudflare/cloudflare/latest)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare KV](https://img.shields.io/badge/Cloudflare-Workers%20KV-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/kv/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, senior DevOps mini-project demonstrating end-to-end **Infrastructure as Code (IaC)**, serverless edge computing, distributed NoSQL key-value persistence, and automated CI/CD deployment pipelines using the **Cloudflare Free tier** and **HashiCorp Terraform**.

---

## 1. Project Overview

This project provisions and deploys a complete **Student Task Management Application** onto Cloudflare's global edge network without manual point-and-click dashboard operations:

- **Infrastructure as Code (IaC):** 100% of the Cloudflare infrastructure (Workers runtime, Workers KV namespace, resource bindings, environment variables, and `workers.dev` DNS route) is defined declaratively using HashiCorp Terraform.
- **Serverless Edge Backend:** A Cloudflare Worker serves both the single-page application (SPA) and a RESTful API with sub-millisecond edge routing.
- **Distributed Edge Persistence:** Task records are persisted in **Cloudflare Workers KV** (`TASKS_KV`), providing resilient, serverless key-value storage.
- **Single-Artifact Deployment:** A custom Node.js bundling script (`scripts/build.js`) compiles and inlines the frontend (HTML, CSS, vanilla JS) directly into `dist/worker.js`, enabling Terraform to deploy the entire stack as a single artifact.
- **Automated CI/CD Pipeline:** GitHub Actions automatically tests, builds, formats, plans, and applies infrastructure changes on push to the `main` branch.
- **Remote State Strategy:** Ephemeral GitHub Actions runners preserve state across builds using **HCP Terraform (Terraform Cloud)** with local execution mode.

---

## 2. System Architecture

```text
+----------------------------------------------------------------------------------------------------+
|                                    DEVELOPER WORKSTATION / CI/CD                                   |
|                                                                                                    |
|   +-----------------------+     node scripts/build.js     +----------------------------------+     |
|   | application/          | ----------------------------> | dist/worker.js                   |     |
|   |  - index.html         |    (Inlines HTML, CSS & JS)   | (Self-contained Worker Bundle)   |     |
|   |  - style.css          |                               +----------------------------------+     |
|   |  - script.js          |                                                 |                      |
|   |  - worker.js          |                                                 |                      |
|   +-----------------------+                                                 v                      |
|                                                                    +-----------------+             |
|   +-----------------------+         terraform apply                |   Terraform     |             |
|   | terraform/            | -------------------------------------> |   Cloudflare    |             |
|   |  - providers.tf       |                                        |    Provider     |             |
|   |  - main.tf            |                                        +--------+--------+             |
|   |  - variables.tf       |                                                 |                      |
|   |  - outputs.tf         |                                                 |                      |
|   +-----------------------+                                                 |                      |
+-----------------------------------------------------------------------------|----------------------+
                                                                              | HTTPS API Calls
                                                                              v
+----------------------------------------------------------------------------------------------------+
|                                      CLOUDFLARE GLOBAL EDGE NETWORK                                |
|                                                                                                    |
|                           [ https://<worker-name>.<subdomain>.workers.dev ]                        |
|                                                     |                                              |
|                                                     v                                              |
|                                  +-------------------------------------+                           |
|                                  |   cloudflare_workers_script         |                           |
|                                  |   (student-task-manager)            |                           |
|                                  |                                     |                           |
|                                  |  * GET  /            -> Serves SPA  |                           |
|                                  |  * POST /api/tasks   -> Create      |                           |
|                                  |  * GET  /api/tasks   -> List All    |                           |
|                                  |  * GET  /api/tasks/:id -> Get One   |                           |
|                                  |  * PUT  /api/tasks/:id -> Update    |                           |
|                                  |  * DEL  /api/tasks/:id -> Delete    |                           |
|                                  +------------------+------------------+                           |
|                                                     |                                              |
|                                                     | Bound via TASKS_KV                           |
|                                                     v                                              |
|                                  +-------------------------------------+                           |
|                                  |  cloudflare_workers_kv_namespace    |                           |
|                                  |  (student_tasks)                    |                           |
|                                  |                                     |                           |
|                                  |  Keys:                              |                           |
|                                  |    - _meta:task_counter (ID seq)    |                           |
|                                  |    - task:T101                      |                           |
|                                  |    - task:T102                      |                           |
|                                  +-------------------------------------+                           |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Project Directory Structure

```text
student-task-manager-iac/
├── terraform/
│   ├── providers.tf             # Cloudflare provider (~> 5.0) and HCP remote backend
│   ├── main.tf                  # KV namespace (title), Worker script (script_name, bindings), workers.dev route
│   ├── variables.tf             # Input variables with strict validation (account_id, worker_name, etc.)
│   ├── outputs.tf               # Outputs: worker_name, kv_namespace_id, application_url
│   └── terraform.tfvars.example # Example variable definitions with safe placeholders
├── application/
│   ├── worker.js                # Edge Worker fetch handler: serves SPA and exposes REST API
│   ├── index.html               # Semantic HTML5 UI with statistics cards and task table
│   ├── style.css                # Polished responsive design, badges, modal, and animations
│   └── script.js                # Vanilla JavaScript client: fetch, create, update, delete, search, sort
├── scripts/
│   └── build.js                 # Inlines frontend assets into single dist/worker.js bundle
├── .github/
│   └── workflows/
│       └── deploy.yml           # Automated CI/CD pipeline (Test -> Build -> Plan -> Apply)
├── screenshots/                 # Submission evidence and visual documentation
│   └── README.md                # Detailed guide for required screenshots
├── .gitignore                   # Excludes state files, secrets, .terraform/, node_modules/, dist/
└── README.md                    # Comprehensive senior DevOps documentation
```

---

## 4. Prerequisites

Before deploying the project, ensure you have the following installed:

1. **Git** (v2.30+): `git --version`
2. **Node.js** (v18.0+ or v20.x+): `node --version`
3. **Terraform CLI** (v1.5.0+): `terraform --version`
4. **Cloudflare Account (Free Tier):**
   - Free account at [cloudflare.com](https://dash.cloudflare.com/)
   - Account ID (32-character hexadecimal string)
   - Cloudflare API Token with permissions:
     - `Account > Workers KV Storage > Edit`
     - `Account > Workers Scripts > Edit`
     - `Account > Account Settings > Read`
   - Active `workers.dev` subdomain claimed on your Cloudflare account.

---

## 5. Setting Environment Variables (Local Setup)

The Cloudflare Terraform provider securely fetches authentication credentials from the `CLOUDFLARE_API_TOKEN` environment variable. **Never hardcode tokens inside `.tf` files.**

### Windows (PowerShell)
```powershell
$env:CLOUDFLARE_API_TOKEN="your_cloudflare_api_token_here"
$env:CLOUDFLARE_ACCOUNT_ID="your_32_char_account_id_here"
```

### Windows (Command Prompt)
```cmd
set CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
set CLOUDFLARE_ACCOUNT_ID=your_32_char_account_id_here
```

### Linux / macOS (Bash & Zsh)
```bash
export CLOUDFLARE_API_TOKEN="your_cloudflare_api_token_here"
export CLOUDFLARE_ACCOUNT_ID="your_32_char_account_id_here"
```

---

## 6. Exact Step-by-Step Execution Commands

Follow these commands in exact sequence from the `student-task-manager-iac` root directory:

### Step 1: Bundle Application Assets
The Node.js script inlines `index.html`, `style.css`, and `script.js` into `dist/worker.js`:
```bash
node scripts/build.js
```
*Expected Output:*
```text
--- Starting Student Task Manager Build Process ---
Created output directory: .../dist
Successfully built: .../dist/worker.js
Bundle Size: ~47 KB
--- Build Finished Successfully ---
```

### Step 2: Configure Terraform Variables
Navigate to the `terraform/` directory:
```bash
cd terraform
```
Copy `terraform.tfvars.example` to `terraform.tfvars`:
```bash
cp terraform.tfvars.example terraform.tfvars
```
Edit `terraform.tfvars` and set your real values:
```hcl
account_id        = "your_32_character_account_id"
worker_name       = "student-task-manager"
kv_namespace_name = "student_tasks"
environment       = "production"
workers_subdomain = "your-subdomain" # (optional: your account workers.dev subdomain)
```

### Step 3: Initialize Terraform (`terraform init`)
Initializes the working directory, downloads the pinned `cloudflare/cloudflare` provider plugin (`~> 5.0`), and sets up state backends:
```bash
terraform init -upgrade
```

### Step 4: Verify Formatting (`terraform fmt`)
Ensures all configuration files adhere to HashiCorp's canonical style conventions:
```bash
terraform fmt -check
```
*(To automatically format files, run `terraform fmt`)*

### Step 5: Validate Configuration (`terraform validate`)
Performs static analysis to verify resource schemas, argument types, and syntax:
```bash
terraform validate
```
*Expected Output:*
```text
Success! The configuration is valid.
```

### Step 6: Generate Execution Plan (`terraform plan`)
Generates an execution plan showing exactly what resources will be created on Cloudflare without modifying live infrastructure:
```bash
terraform plan -out=tfplan
```
*Expected Resources Planned:*
- `+ cloudflare_workers_kv_namespace.student_tasks`
- `+ cloudflare_workers_script.student_task_manager`
- `+ cloudflare_workers_script_subdomain.workers_dev_route`
- **Plan:** `3 to add, 0 to change, 0 to destroy.`

### Step 7: Apply Infrastructure (`terraform apply`)
Applies the plan to Cloudflare:
```bash
terraform apply tfplan
```
*(Or without a saved plan file: `terraform apply` and type `yes` when prompted)*

### Step 8: Inspect Live State (`terraform show`)
Displays the provisioned resources, resource IDs, and bindings currently recorded in state:
```bash
terraform show
```

### Step 9: View Provisioning Outputs
Display the deployed endpoints:
```bash
terraform output
```
*Example Output:*
```text
application_url = "https://student-task-manager.your-subdomain.workers.dev"
kv_namespace_id = "f0a1b2c3d4e5f60718293a4b5c6d7e8f"
worker_name     = "student-task-manager"
```

---

## 7. Infrastructure as Code (IaC) Lifecycle Demonstration

Demonstrating the full lifecycle of infrastructure is a core DevOps requirement:

```text
[ Provision Initial State ]
           │
           ▼
[ Modify Configuration (e.g. KV name or Environment) ]
           │
           ▼
[ terraform plan  --> Observe Delta ]
           │
           ▼
[ terraform apply --> In-Place Update / Re-creation ]
           │
           ▼
[ terraform plan -destroy --> Preview Teardown ]
           │
           ▼
[ terraform destroy --> Zero-Downtime Clean Teardown ]
           │
           ▼
[ terraform apply --> 100% Deterministic Recreation ]
```

### Step-by-Step Lifecycle Test:

1. **Modify Configuration:**
   Change the environment variable in `terraform.tfvars`:
   ```hcl
   environment = "staging"
   ```
2. **Preview Changes:**
   ```bash
   terraform plan
   ```
   *Terraform detects the changed `plain_text_binding` and plans an in-place update.*
3. **Apply the Update:**
   ```bash
   terraform apply -auto-approve
   ```
4. **Plan Infrastructure Teardown:**
   ```bash
   terraform plan -destroy
   ```
5. **Destroy All Provisioned Resources:**
   ```bash
   terraform destroy -auto-approve
   ```
   *Expected Output:* `Destroy complete! Resources: 3 destroyed.`
6. **Recreate From Scratch (Deterministic Reproducibility):**
   ```bash
   terraform apply -auto-approve
   ```
   *All resources and bindings are instantly recreated in their expected state.*

---

## 8. REST API Documentation & cURL Verification

The Worker exposes a full REST API under `/api/tasks` backed by Cloudflare Workers KV. Replace `<APP_URL>` with your actual Worker URL (e.g., `https://student-task-manager.<subdomain>.workers.dev`).

### 1. Health Check
```bash
curl -X GET "<APP_URL>/api/health"
```
**Response (200 OK):**
```json
{
  "status": "healthy",
  "app": "student-task-manager",
  "environment": "production",
  "kvBindingReady": true,
  "timestamp": "2026-10-24T10:00:00.000Z"
}
```

### 2. Create Task (POST /api/tasks)
Automatically increments sequential ID (`T101`, `T102`, etc.):
```bash
curl -X POST "<APP_URL>/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete Cloud Computing Lab 3",
    "priority": "High",
    "status": "Pending"
  }'
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "T101",
    "title": "Complete Cloud Computing Lab 3",
    "priority": "High",
    "status": "Pending",
    "createdDate": "2026-10-24T10:05:00.000Z"
  }
}
```

### 3. List All Tasks (GET /api/tasks)
```bash
curl -X GET "<APP_URL>/api/tasks"
```
**Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "T101",
      "title": "Complete Cloud Computing Lab 3",
      "priority": "High",
      "status": "Pending",
      "createdDate": "2026-10-24T10:05:00.000Z"
    }
  ]
}
```

### 4. Get Single Task (GET /api/tasks/:id)
```bash
curl -X GET "<APP_URL>/api/tasks/T101"
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "T101",
    "title": "Complete Cloud Computing Lab 3",
    "priority": "High",
    "status": "Pending",
    "createdDate": "2026-10-24T10:05:00.000Z"
  }
}
```

### 5. Update Task (PUT /api/tasks/:id)
Update title, priority, or toggle status:
```bash
curl -X PUT "<APP_URL>/api/tasks/T101" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Completed"
  }'
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task 'T101' updated successfully",
  "data": {
    "id": "T101",
    "title": "Complete Cloud Computing Lab 3",
    "priority": "High",
    "status": "Completed",
    "createdDate": "2026-10-24T10:05:00.000Z",
    "updatedDate": "2026-10-24T10:15:00.000Z"
  }
}
```

### 6. Delete Task (DELETE /api/tasks/:id)
```bash
curl -X DELETE "<APP_URL>/api/tasks/T101"
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task 'T101' deleted successfully"
}
```

---

## 9. CI/CD Deployment with GitHub Actions

### Why Remote State is Required
GitHub Actions runners are **ephemeral**; every pipeline execution boots inside a brand new, isolated virtual machine that is destroyed upon workflow completion. If Terraform stores state in a local `terraform.tfstate` file, that state is permanently lost between runs, causing subsequent workflow runs to attempt to recreate existing resources or fail with collisions.

To solve this, we configure a **Remote State Backend** using **HCP Terraform (Terraform Cloud)** (Free tier):
- State is securely persisted and locked remotely in HashiCorp's managed backend.
- Workspace execution mode is set to **"Local"** so the GitHub Actions runner executes Terraform binaries directly.

### GitHub Secrets Configuration
In your GitHub repository, navigate to **Settings > Secrets and variables > Actions** and add the following repository secrets:

| Secret Name | Value Description | Example |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token with Workers & KV Edit access | `xX_...` |
| `CLOUDFLARE_ACCOUNT_ID` | 32-character Cloudflare Account ID | `0123456789abcdef0123456789abcdef` |
| `TF_API_TOKEN` | *(Optional if using HCP Terraform)* User or Team API token from app.terraform.io | `user-...` |

### Pipeline Workflow Steps (`.github/workflows/deploy.yml`):
1. **Checkout:** Clones the repository.
2. **Setup Node.js:** Initializes Node.js 20 environment.
3. **Build Bundle:** Executes `node scripts/build.js` to inline HTML, CSS, and JS into `dist/worker.js`.
4. **Setup Terraform:** Configures the Terraform CLI and credentials.
5. **Terraform Init:** Initializes backend and provider plugins.
6. **Terraform Format Check:** Runs `terraform fmt -check` to enforce clean code standards.
7. **Terraform Validate:** Validates syntax and configuration consistency.
8. **Terraform Plan:** Generates execution plan against current Cloudflare state.
9. **Terraform Apply:** Automatically applies planned changes with `-auto-approve`.
10. **Display Outputs:** Prints the application URL and resource IDs.

---

## 10. Security & Compliance Highlights

- **Zero-Credential Commits:** Authentication tokens and account identifiers are strictly passed through environment variables and GitHub Secrets.
- **Gitignore Protection:** Local state files (`*.tfstate`), runtime caches (`.terraform/`), and sensitive variable files (`terraform.tfvars`) are blocked from version control.
- **Strict Input Validation:** The Worker validates payload structures, character limits (<= 200 chars), priority enums (`High`, `Medium`, `Low`), and status enums (`Pending`, `Completed`).
- **XSS & Injection Mitigation:** Frontend output uses HTML escaping and vanilla DOM rendering without unsafe `eval()` or unescaped innerHTML injections.
- **CORS Hardening:** Standardized CORS headers allow cross-origin API testing while preflight `OPTIONS` requests respond with HTTP 204.

---

## 11. Author & License

- **Project:** Serverless Student Task Management Application Using Terraform IaC
- **Domain:** Cloud Computing, Infrastructure as Code, Serverless Edge Architecture
- **License:** MIT License

