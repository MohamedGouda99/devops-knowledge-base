resource "google_secret_manager_secret" "openai_api_key" {
  project   = var.project_id
  secret_id = "openai-api-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "openai_api_key" {
  secret      = google_secret_manager_secret.openai_api_key.id
  secret_data = var.openai_api_key
}

resource "google_secret_manager_secret" "supabase_url" {
  project   = var.project_id
  secret_id = "supabase-url"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "supabase_url" {
  secret      = google_secret_manager_secret.supabase_url.id
  secret_data = var.supabase_url
}

resource "google_secret_manager_secret" "supabase_key" {
  project   = var.project_id
  secret_id = "supabase-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "supabase_key" {
  secret      = google_secret_manager_secret.supabase_key.id
  secret_data = var.supabase_key
}

resource "google_secret_manager_secret_iam_member" "openai_accessor" {
  for_each  = toset(var.secret_accessors)
  project   = var.project_id
  secret_id = google_secret_manager_secret.openai_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${each.value}"
}

resource "google_secret_manager_secret_iam_member" "supabase_url_accessor" {
  for_each  = toset(var.secret_accessors)
  project   = var.project_id
  secret_id = google_secret_manager_secret.supabase_url.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${each.value}"
}

resource "google_secret_manager_secret_iam_member" "supabase_key_accessor" {
  for_each  = toset(var.secret_accessors)
  project   = var.project_id
  secret_id = google_secret_manager_secret.supabase_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${each.value}"
}
