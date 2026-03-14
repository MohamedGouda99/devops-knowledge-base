variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "openai_api_key" {
  description = "OpenAI API key value"
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

variable "secret_accessors" {
  description = "List of service account emails that can access the secrets"
  type        = list(string)
  default     = []
}
