output "openai_api_key_secret_id" {
  description = "Secret Manager secret ID for OpenAI API key"
  value       = google_secret_manager_secret.openai_api_key.secret_id
}

output "supabase_url_secret_id" {
  description = "Secret Manager secret ID for Supabase URL"
  value       = google_secret_manager_secret.supabase_url.secret_id
}

output "supabase_key_secret_id" {
  description = "Secret Manager secret ID for Supabase key"
  value       = google_secret_manager_secret.supabase_key.secret_id
}
