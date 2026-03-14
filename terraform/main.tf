terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "devops-kb-tfstate"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ──────────────────────────────────────────────
# Enable required GCP APIs
# ──────────────────────────────────────────────
module "apis" {
  source     = "./modules/apis"
  project_id = var.project_id
}

# ──────────────────────────────────────────────
# IAM: service accounts and bindings
# ──────────────────────────────────────────────
module "iam" {
  source     = "./modules/iam"
  project_id = var.project_id

  depends_on = [module.apis]
}

# ──────────────────────────────────────────────
# Secret Manager: store sensitive config
# ──────────────────────────────────────────────
module "secret_manager" {
  source     = "./modules/secret-manager"
  project_id = var.project_id

  openai_api_key = var.openai_api_key
  supabase_url   = var.supabase_url
  supabase_key   = var.supabase_key

  secret_accessors = [module.iam.backend_sa_email]

  depends_on = [module.apis]
}

# ──────────────────────────────────────────────
# Cloud Run: Backend service
# ──────────────────────────────────────────────
module "backend" {
  source     = "./modules/cloud-run"
  project_id = var.project_id
  region     = var.region

  service_name    = "devops-kb-backend"
  container_image = var.backend_image
  container_port  = 8000
  service_account = module.iam.backend_sa_email

  memory = "1Gi"
  cpu    = "1"

  min_instances = 0
  max_instances = 5

  env_vars = {
    OPENAI_MODEL     = var.openai_model
    EMBEDDING_MODEL  = var.embedding_model
    CORS_ORIGINS     = jsonencode(var.cors_origins)
    LOG_LEVEL        = "info"
  }

  secret_env_vars = {
    OPENAI_API_KEY = module.secret_manager.openai_api_key_secret_id
    SUPABASE_URL   = module.secret_manager.supabase_url_secret_id
    SUPABASE_KEY   = module.secret_manager.supabase_key_secret_id
  }

  allow_unauthenticated = false

  depends_on = [module.apis, module.secret_manager]
}

# ──────────────────────────────────────────────
# Cloud Run: Frontend service
# ──────────────────────────────────────────────
module "frontend" {
  source     = "./modules/cloud-run"
  project_id = var.project_id
  region     = var.region

  service_name    = "devops-kb-frontend"
  container_image = var.frontend_image
  container_port  = 3000
  service_account = module.iam.frontend_sa_email

  memory = "512Mi"
  cpu    = "1"

  min_instances = 0
  max_instances = 3

  env_vars = {
    VITE_API_URL = module.backend.service_url
  }

  secret_env_vars = {}

  allow_unauthenticated = true

  depends_on = [module.apis, module.backend]
}
