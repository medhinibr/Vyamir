terraform {
  required_providers {
    render = {
      source  = "render-oss/render"
      version = ">= 1.0.0"
    }
  }
}

provider "render" {
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
}

resource "render_web_service" "vyamir" {
  name   = "vyamir-app"
  plan   = "free"
  region = "oregon"

  runtime_source = {
    docker = {
      repo_url = "https://github.com/medhinibr/Vyamir"
      branch   = "main"
    }
  }

  env_vars = {
    "PEXELS_API_KEY" = {
      value = var.pexels_api_key
    }
    "FIREBASE_API_KEY" = {
      value = var.firebase_api_key
    }
    "GMAIL_APP_PASSWORD" = {
      value = var.gmail_password
    }
  }
}

variable "render_api_key" {
  type        = string
  description = "Render API Key"
}

variable "render_owner_id" {
  type        = string
  description = "Render Owner ID (usr-... or tea-...)"
}

variable "pexels_api_key" {
  type        = string
  description = "Pexels media library API key"
}

variable "firebase_api_key" {
  type        = string
  description = "Firebase project credentials api key"
}

variable "gmail_password" {
  type        = string
  description = "App password for SMTP email transmission"
}
