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
// Module: Organization Policy
///////////////////////////////////////////////////////////
// This module applies organization policies at the org, folder,
// or project level using a flexible input object.

module "org-policy" {
  source            = "terraform-google-modules/org-policy/google"    // Source of the org-policy module
  version           = "7.0.0"                                         // Specific version for consistency and stability
  for_each          = { for x in var.org-policy : x.constraint => x } // Loop through each constraint definition in input
  constraint        = each.value.constraint                           // Constraint name (e.g., constraints/compute.disableSerialPortAccess)
  policy_type       = each.value.policy_type                          // Type of policy: 'boolean', 'list', or 'restore'
  policy_for        = each.value.policy_for                           // Target: 'organization', 'folder', or 'project'
  organization_id   = each.value.organization_id                      // Org ID if applying at org level
  folder_id         = each.value.folder_id                            // Folder ID if applying at folder level
  project_id        = each.value.project_id                           // Project ID if applying at project level
  enforce           = each.value.enforce                              // Boolean to enforce policy (used with boolean policies)
  allow             = each.value.allow                                // List of allowed values (used with list policies)
  allow_list_length = each.value.allow_list_length                    // Optional length constraint for allow list
  exclude_folders   = each.value.exclude_folders                      // List of folder IDs to exclude from enforcement
  exclude_projects  = each.value.exclude_projects                     // List of project IDs to exclude from enforcement
}

