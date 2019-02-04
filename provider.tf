provider "google" {
  credentials = "${file("account.json")}"
  project     = "lighthouse-metrics"
  region      = "us-central1"
}
