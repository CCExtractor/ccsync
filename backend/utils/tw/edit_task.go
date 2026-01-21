package tw

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// EditTaskInTaskwarrior edits a task in Taskwarrior using batched command execution
// This function uses a single 'task modify' command for better performance instead of
// spawning multiple shell processes for each field modification.
func EditTaskInTaskwarrior(params models.EditTaskParams) error {
	// Create isolated temporary directory for this operation
	tempDir, err := os.MkdirTemp("", utils.SafeTempDirPrefix("taskwarrior-", params.Email))
	if err != nil {
		return fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Configure Taskwarrior with user's encryption and sync settings
	origin := os.Getenv("CONTAINER_ORIGIN")
	if err := SetTaskwarriorConfig(tempDir, params.EncryptionSecret, origin, params.UUID); err != nil {
		return err
	}

	// Sync to get latest task data
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	// Build batched modify command arguments
	// Format: task <uuid> modify <arg1> <arg2> ... <argN>
	modifyArgs := []string{params.TaskUUID, "modify"}

	// Add description if provided
	if params.Description != "" {
		modifyArgs = append(modifyArgs, params.Description)
	}

	// Add project if provided
	if params.Project != "" {
		modifyArgs = append(modifyArgs, "project:"+params.Project)
	}

	// Add wait date if provided
	// Convert date format from YYYY-MM-DD to YYYY-MM-DDTHH:MM:SS
	if params.Wait != "" {
		formattedWait := params.Wait + "T00:00:00"
		modifyArgs = append(modifyArgs, "wait:"+formattedWait)
	}

	// Add start date if provided
	if params.Start != "" {
		modifyArgs = append(modifyArgs, "start:"+params.Start)
	}

	// Add entry date if provided
	if params.Entry != "" {
		modifyArgs = append(modifyArgs, "entry:"+params.Entry)
	}

	// Add end date if provided
	if params.End != "" {
		modifyArgs = append(modifyArgs, "end:"+params.End)
	}

	// Add dependencies
	// Always set to ensure clearing works (empty string clears dependencies)
	dependsStr := strings.Join(params.Depends, ",")
	modifyArgs = append(modifyArgs, "depends:"+dependsStr)

	// Add due date if provided
	// Convert date format from YYYY-MM-DD to YYYY-MM-DDTHH:MM:SS
	if params.Due != "" {
		formattedDue := params.Due + "T00:00:00"
		modifyArgs = append(modifyArgs, "due:"+formattedDue)
	}

	// Add recurrence pattern if provided
	// This will automatically set the rtype field in Taskwarrior
	if params.Recur != "" {
		modifyArgs = append(modifyArgs, "recur:"+params.Recur)
	}

	// Add tags (supports +tag to add, -tag to remove)
	// Tags are processed individually as they have special prefix syntax
	for _, tag := range params.Tags {
		if strings.HasPrefix(tag, "+") {
			// Add tag (already has + prefix)
			modifyArgs = append(modifyArgs, tag)
		} else if strings.HasPrefix(tag, "-") {
			// Remove tag (already has - prefix)
			modifyArgs = append(modifyArgs, tag)
		} else {
			// Add tag without prefix
			modifyArgs = append(modifyArgs, "+"+tag)
		}
	}

	// Execute the batched modify command
	// This single command replaces 10+ individual shell process spawns
	if err := utils.ExecCommand("task", modifyArgs...); err != nil {
		return fmt.Errorf("failed to edit task: %v", err)
	}

	// Handle annotations separately as they require individual commands
	// Annotations cannot be batched with the modify command
	if len(params.Annotations) >= 0 {
		// First, remove all existing annotations
		output, err := utils.ExecCommandForOutputInDir(tempDir, "task", params.TaskUUID, "export")
		if err == nil {
			var tasks []map[string]interface{}
			if err := json.Unmarshal(output, &tasks); err == nil && len(tasks) > 0 {
				if existingAnnotations, ok := tasks[0]["annotations"].([]interface{}); ok {
					// Remove each existing annotation
					for _, ann := range existingAnnotations {
						if annMap, ok := ann.(map[string]interface{}); ok {
							if desc, ok := annMap["description"].(string); ok {
								// Ignore errors on denotate as annotation might not exist
								utils.ExecCommand("task", params.TaskUUID, "denotate", desc)
							}
						}
					}
				}
			}
		}

		// Add new annotations
		for _, annotation := range params.Annotations {
			if annotation.Description != "" {
				if err := utils.ExecCommand("task", params.TaskUUID, "annotate", annotation.Description); err != nil {
					return fmt.Errorf("failed to add annotation %s: %v", annotation.Description, err)
				}
			}
		}
	}

	// Sync changes back to server
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	return nil
}
