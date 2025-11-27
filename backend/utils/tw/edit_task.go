package tw

import (
	"ccsync_backend/utils"
	"fmt"
	"os"
	"strings"
)

func EditTaskInTaskwarrior(uuid, description, email, encryptionSecret, taskID string, tags []string, project string, start string, entry string, wait string, end string, depends []string, rtype string) error {
	if err := utils.ExecCommand("rm", "-rf", "/root/.task"); err != nil {
		return fmt.Errorf("error deleting Taskwarrior data: %v", err)
	}
	tempDir, err := os.MkdirTemp("", "taskwarrior-"+email)
	if err != nil {
		return fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	origin := os.Getenv("CONTAINER_ORIGIN")
	if err := SetTaskwarriorConfig(tempDir, encryptionSecret, origin, uuid); err != nil {
		return err
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	// Escape the double quotes in the description and format it
	if err := utils.ExecCommand("task", taskID, "modify", description); err != nil {
		fmt.Println("task " + taskID + " modify " + description)
		return fmt.Errorf("failed to edit task: %v", err)
	}

	// Handle project
	if project != "" {
		if err := utils.ExecCommand("task", taskID, "modify", "project:"+project); err != nil {
			return fmt.Errorf("failed to set project %s: %v", project, err)
		}
	}

	// Handle wait date
	if wait != "" {
		// Convert `2025-11-29` -> `2025-11-29T00:00:00`
		formattedWait := wait + "T00:00:00"

		if err := utils.ExecCommand("task", taskID, "modify", "wait:"+formattedWait); err != nil {
			return fmt.Errorf("failed to set wait date %s: %v", formattedWait, err)
		}
	}

	// Handle tags
	if len(tags) > 0 {
		for _, tag := range tags {
			if strings.HasPrefix(tag, "+") {
				// Add tag
				tagValue := strings.TrimPrefix(tag, "+")
				if err := utils.ExecCommand("task", taskID, "modify", "+"+tagValue); err != nil {
					return fmt.Errorf("failed to add tag %s: %v", tagValue, err)
				}
			} else if strings.HasPrefix(tag, "-") {
				// Remove tag
				tagValue := strings.TrimPrefix(tag, "-")
				if err := utils.ExecCommand("task", taskID, "modify", "-"+tagValue); err != nil {
					return fmt.Errorf("failed to remove tag %s: %v", tagValue, err)
				}
			} else {
				// Add tag without prefix
				if err := utils.ExecCommand("task", taskID, "modify", "+"+tag); err != nil {
					return fmt.Errorf("failed to add tag %s: %v", tag, err)
				}
			}
		}
	}

	// Handle start date
	if start != "" {
		if err := utils.ExecCommand("task", taskID, "modify", "start:"+start); err != nil {
			return fmt.Errorf("failed to set start date %s: %v", start, err)
		}
	}

	// Handle entry date
	if entry != "" {
		if err := utils.ExecCommand("task", taskID, "modify", "entry:"+entry); err != nil {
			return fmt.Errorf("failed to set entry date %s: %v", entry, err)
		}
	}

	// Handle end date
	if end != "" {
		if err := utils.ExecCommand("task", taskID, "modify", "end:"+end); err != nil {
			return fmt.Errorf("failed to set end date %s: %v", end, err)
		}
	}

	// Handle depends
	if len(depends) > 0 {
		dependsStr := strings.Join(depends, ",")
		if err := utils.ExecCommand("task", taskID, "modify", "depends:"+dependsStr); err != nil {
			return fmt.Errorf("failed to set depends %s: %v", dependsStr, err)
		}
	}

	// Note: rtype is read-only and automatically set by taskwarrior when recur field is set
	// We accept it in the API for completeness but don't modify it directly
	// If rtype needs to be changed, modify the recur field instead

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}
	return nil
}
