resource "google_container_cluster" "primary" {
  name = "lighthouse-metrics"
  zone = "us-west1-a"

  min_master_version = "latest"

  # this is the default pool, we'll set it to a free-tier f1-micro;
  # the cluster needs at least one node at all times, and for f1-micro
  # it requires 3. we'll make them preemptible so they're cheap.
  initial_node_count = 3

  # disable all addons
  addons_config = {
    kubernetes_dashboard = {
      disabled = true
    }

    http_load_balancing {
      disabled = true
    }

    horizontal_pod_autoscaling {
      disabled = true
    }

    network_policy_config {
      disabled = true
    }
  }

  node_config {
    machine_type = "f1-micro"

    preemptible = true

    # necessary to ensure the correct functioning of the cluster
    oauth_scopes = [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]
  }
}

# dedicated node pool for nodes that will run LH pods. starts at 0.
# autoscaling.
resource "google_container_node_pool" "np" {
  name    = "lighthouse-metrics-workers"
  zone    = "us-west1-a"
  cluster = "${google_container_cluster.primary.name}"

  initial_node_count = 0

  autoscaling = {
    # TF docs say this can't be 0 but here it is!
    min_node_count = 0
    max_node_count = 10
  }

  node_config {
    machine_type = "n1-standard-2"

    # necessary to ensure the correct functioning of the cluster
    oauth_scopes = [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]

    # do not allow any pod to be scheduled on these nodes unless
    # they tolerate the following taint
    taint = [
      {
        key    = "dedicated"
        value  = "lighthouse"
        effect = "NO_SCHEDULE"
      },
    ]

    # the label is so that pods can say "i will ONLY be scheduled
    # on a node with this label" (via an affinity)
    labels = {
      dedicated = "lighthouse"
    }
  }
}
