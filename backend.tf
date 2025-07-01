terraform {
  backend "gcs" {
    bucket = "deeeee"
    prefix = "terraform/workspace/state"
  }
}
