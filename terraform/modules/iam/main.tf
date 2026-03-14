resource "google_service_account" "backend" {
  project      = var.project_id
  account_id   = "devops-kb-backend"
  display_name = "DevOps KB Backend Service Account"
  description  = "Service account for the backend Cloud Run service"
}

resource "google_service_account" "frontend" {
  project      = var.project_id
  account_id   = "devops-kb-frontend"
  display_name = "DevOps KB Frontend Service Account"
  description  = "Service account for the frontend Cloud Run service"
}

resource "google_project_iam_member" "backend_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_trace_agent" {
  project = var.project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "frontend_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.frontend.email}"
}
