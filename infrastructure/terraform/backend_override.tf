terraform {
  # Local backend used only as a developer/CI convenience. In PR validate we run
  # `terraform init -backend=false` so this file is optional and can be ignored.
  backend "local" {}
}
