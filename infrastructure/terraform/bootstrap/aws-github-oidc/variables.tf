variable "account_id" { type = string }
variable "region"     { type = string  default = "us-west-2" }
variable "role_name"  { type = string  default = "TerraformGithubOIDCRole" }
variable "github_org" { type = string }
variable "github_repo"{ type = string }
