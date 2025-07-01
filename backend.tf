terraform {
  backend "gcs" {
    bucket = "niveus-bucket"
    prefix = "terraform/Organisation/state"
  }
}
