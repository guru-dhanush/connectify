terraform {
  backend "gcs" {
    bucket = "ggggggggg"
    prefix = "terraform/organisation/state"
  }
}
