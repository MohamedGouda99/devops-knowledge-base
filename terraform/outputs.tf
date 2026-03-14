output "backend_url" {
  description = "URL of the backend Cloud Run service"
  value       = module.backend.service_url
}

output "frontend_url" {
  description = "URL of the frontend Cloud Run service"
  value       = module.frontend.service_url
}

output "backend_service_account" {
  description = "Email of the backend service account"
  value       = module.iam.backend_sa_email
}

output "frontend_service_account" {
  description = "Email of the frontend service account"
  value       = module.iam.frontend_sa_email
}
