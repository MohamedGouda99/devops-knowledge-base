variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
}

variable "container_image" {
  description = "Docker image URI"
  type        = string
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
}

variable "service_account" {
  description = "Service account email for the Cloud Run service"
  type        = string
}

variable "memory" {
  description = "Memory limit (e.g. 512Mi, 1Gi)"
  type        = string
  default     = "512Mi"
}

variable "cpu" {
  description = "CPU limit (e.g. 1, 2)"
  type        = string
  default     = "1"
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 5
}

variable "env_vars" {
  description = "Plain-text environment variables"
  type        = map(string)
  default     = {}
}

variable "secret_env_vars" {
  description = "Secret Manager-backed environment variables (name => secret_id)"
  type        = map(string)
  default     = {}
}

variable "allow_unauthenticated" {
  description = "Whether to allow unauthenticated access"
  type        = bool
  default     = false
}
