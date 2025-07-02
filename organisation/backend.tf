terraform {
  backend "gcs" {
    bucket = "tvs-bucket-4821"
    prefix = "terraform/organisation/state"
  }
}
