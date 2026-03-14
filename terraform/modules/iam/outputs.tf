output "backend_sa_email" {
  description = "Email of the backend service account"
  value       = google_service_account.backend.email
}

output "frontend_sa_email" {
  description = "Email of the frontend service account"
  value       = google_service_account.frontend.email
}
