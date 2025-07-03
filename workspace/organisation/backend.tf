terraform {
  backend "gcs" {
    bucket = "monolith-app-storage-001"
    prefix = "terraform/organisation/state"
  }
}
