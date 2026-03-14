variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "us-central1"
}

variable "openai_api_key" {
  description = "OpenAI API key (stored in Secret Manager)"
  type        = string
  sensitive   = true
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
}

variable "supabase_key" {
  description = "Supabase anon/service key"
  type        = string
  sensitive   = true
}

variable "openai_model" {
  description = "OpenAI chat model name"
  type        = string
  default     = "gpt-4o"
}

variable "embedding_model" {
  description = "OpenAI embedding model name"
  type        = string
  default     = "text-embedding-3-small"
}

variable "backend_image" {
  description = "Docker image URI for backend Cloud Run service"
  type        = string
}

variable "frontend_image" {
  description = "Docker image URI for frontend Cloud Run service"
  type        = string
}

variable "cors_origins" {
  description = "Allowed CORS origins for the backend"
  type        = list(string)
  default     = ["*"]
}
