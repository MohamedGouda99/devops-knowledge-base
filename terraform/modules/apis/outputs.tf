output "enabled_apis" {
  description = "List of enabled API services"
  value       = [for api in google_project_service.required_apis : api.service]
}

output "artifact_registry_id" {
  description = "Artifact Registry repository ID"
  value       = google_artifact_registry_repository.docker.repository_id
}
