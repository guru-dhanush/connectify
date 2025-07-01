terraform {
  backend "gcs" {
    bucket = "new-bucket"
    prefix = "terraform/workspace/state"
  }
}
