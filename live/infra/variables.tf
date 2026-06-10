variable "region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-southeast-2"
}

variable "name_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "flashcards-live"
}

variable "tags" {
  description = "Tags applied to every AWS resource via provider default_tags"
  type        = map(string)
  default = {
    Owner     = "Scott N"
    Project   = "flashcards-live"
    ManagedBy = "terraform"
  }
}

variable "log_retention_days" {
  description = "CloudWatch retention for Lambda and API Gateway access logs"
  type        = number
  default     = 14
}

variable "custom_domain" {
  description = "Optional custom domain for the WebSocket API (e.g. play.example.com). When set, an ACM certificate is created; add the acm_validation_records output to Cloudflare (DNS only), then set custom_domain_ready"
  type        = string
  default     = ""
}

variable "custom_domain_ready" {
  description = "Set true once the ACM certificate is issued (validation records live in Cloudflare); creates the API Gateway custom domain, see cloudflare_app_record output"
  type        = bool
  default     = false

  validation {
    condition     = var.custom_domain_ready ? var.custom_domain != "" : true
    error_message = "custom_domain_ready requires custom_domain to be set."
  }
}
