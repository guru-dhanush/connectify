terraform {
  backend "gcs" {
    bucket = "test"
    prefix = "terraform/organisation/state"
  }
}
