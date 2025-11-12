package tw

import (
	"ccsync_backend/utils"
	"fmt"
	"os"
	"strings"
)

func EditTaskInTaskwarrior(uuid, description, email, encryptionSecret, taskID string, tags []string, project string) error {
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

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}
	return nil
}
