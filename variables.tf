/*
 * Copyright 2025 
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

///////////////////////////////////////////////////////////
// VARIABLES: Folder Creation in Organization
///////////////////////////////////////////////////////////

variable "parent_id" {
  type        = string
  description = "Resource ID of the parent (Organization or Folder). Format: 'organizations/ORG_ID' or 'folders/FOLDER_ID'."
}

variable "parent_type" {
  type        = string
  default     = "organizations"
  description = "Parent resource type. Allowed values: 'organizations' or 'folders'."
}

variable "folders" {
  type        = list(string)
  default     = []
  description = "List of folder names to be created under the specified parent."
}

///////////////////////////////////////////////////////////
// VARIABLES: Organization Policy Configuration
///////////////////////////////////////////////////////////

variable "org-policy" {
  description = <<EOT
List of organization policy configurations. Each object must have:
  - constraint        : Constraint to be applied (e.g., 'constraints/compute.requireOsLogin')
  - policy_type       : Type of policy ('boolean', 'list', or 'restore')
  - policy_for        : Target level ('organization', 'folder', or 'project')
  - organization_id   : Organization ID (if applicable)
  - folder_id         : Folder ID (if applicable)
  - project_id        : Project ID (if applicable)
  - enforce           : (bool) Enforce boolean constraint
  - allow             : (list) Allowed values for list constraints
  - allow_list_length : (number) Optional validation on list size
  - exclude_folders   : (set) Folders to exclude from policy
  - exclude_projects  : (set) Projects to exclude from policy
EOT

  type = list(object({
    constraint        = string
    policy_type       = string
    policy_for        = string
    organization_id   = string
    folder_id         = string
    project_id        = string
    enforce           = bool
    allow             = list(string)
    allow_list_length = number
    exclude_folders   = set(string)
    exclude_projects  = set(string)
  }))
  default = []
}

///////////////////////////////////////////////////////////
// VARIABLES: IAM Access Bindings for Organization
///////////////////////////////////////////////////////////

variable "organizations" {
  type        = list(string)
  default     = []
  description = "List of organization IDs where IAM bindings should be applied."
}

variable "mode" {
  type        = string
  default     = "additive"
  description = "IAM binding mode. 'additive' adds members, 'authoritative' replaces existing bindings."
}

variable "bindings" {
  type        = map(list(string))
  default     = {}
  description = "IAM bindings in the format: role => list of members. Example: roles/viewer => [\"user:abc@example.com\"]"
}

variable "conditional_bindings" {
  type = list(object({
    role        = string
    title       = string
    description = string
    expression  = string
    members     = list(string)
  }))
  default     = []
  description = <<EOT
List of conditional IAM bindings. Each object must include:
  - role        : IAM role to bind
  - title       : Title of the condition
  - description : Description of the condition
  - expression  : CEL expression (Common Expression Language) used to evaluate the condition
  - members     : List of members to apply condition to
EOT
}

///////////////////////////////////////////////////////////
// VARIABLES: Billing Export to BigQuery Dataset
///////////////////////////////////////////////////////////

variable "dataset_name" {
  type        = string
  default     = null
  description = "Friendly name for the BigQuery dataset to hold exported billing data."
}

variable "project_id" {
  type        = string
  description = "ID of the project where the billing dataset should be created."
}

variable "description" {
  type        = string
  default     = null
  description = "Description for the BigQuery dataset (optional)."
}

variable "dataset_region" {
  type        = string
  default     = ""
  description = "Regional location where the BigQuery dataset will be created."
}

variable "billing_sink_name" {
  type        = string
  default     = null
  description = "Name for the billing sink (used in log export)."
}

variable "export_billing_account" {
  type        = string
  description = "Billing account ID from which usage data will be exported."
}

///////////////////////////////////////////////////////////
// VARIABLES: Log Export to Bucket
///////////////////////////////////////////////////////////

variable "bucket_project" {
  description = "Project where the GCS bucket will be created (common services project)"
  type        = string
  default     = ""
}

variable "log_filter" {
  description = "Log filter query to define which logs are exported"
  type        = string
  default     = ""
}

variable "location" {
  description = "Location (region) where the storage bucket will be created"
  type        = string
  default     = "asia-southeast1"
}

variable "retention_policy" {
  description = "Bucket's data retention policy: how long objects should be retained"
  type = object({
    is_locked        = bool   // Whether the retention policy is locked
    retention_period = number // Retention period in seconds
  })
  default = null
}

variable "lifecycle_rules" {
  description = "Lifecycle configuration for the bucket (e.g. auto-delete after X days)"
  type = list(object({
    action    = any // Action to take (e.g., Delete, SetStorageClass)
    condition = any // Conditions under which the action is applied
  }))
  default = []
}
