terraform {
  required_providers {
    render = {
      source  = "render-oss/render"
      version = ">= 1.0.0"
    }
  }
}

provider "render" {
  api_key = var.render_api_key
}

resource "render_web_service" "vyamir" {
  name    = "vyamir-app"
  plan    = "free"
  runtime = "docker"
  
  repo {
    url    = "https://github.com/medhinibr/Vyamir"
    branch = "main"
  }

  docker_command = "gunicorn --bind 0.0.0.0:8080 app:app"
  
  env_vars = {
    "PEXELS_API_KEY"      = var.pexels_api_key
    "FIREBASE_API_KEY"    = var.firebase_api_key
    "GMAIL_APP_PASSWORD"  = var.gmail_password
  }
}

variable "render_api_key" {
  type        = string
  description = "Render API Key"
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
