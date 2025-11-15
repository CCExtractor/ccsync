package tw

import (
	"ccsync_backend/utils"
	"fmt"
	"os"
	"strings"
)

func EditTaskInTaskwarrior(uuid, description, email, encryptionSecret, taskID string, tags []string, project string, start string) error {
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
	if description != "" {
		escapedDescription := fmt.Sprintf(`description:"%s"`, strings.ReplaceAll(description, `"`, `\"`))
		if err := utils.ExecCommandInDir(tempDir, "task", taskID, "modify", escapedDescription, "rc.confirmation=off"); err != nil {
			return fmt.Errorf("failed to edit task: %v", err)
		}
	}

	// Handle project
	if project != "" {
		if err := utils.ExecCommandInDir(tempDir, "task", taskID, "modify", "project:"+project, "rc.confirmation=off"); err != nil {
			return fmt.Errorf("failed to set project %s: %v", project, err)
		}
	}

	// Handle tags
	if len(tags) > 0 {
		for _, tag := range tags {
			if strings.HasPrefix(tag, "+") {
				tagValue := strings.TrimPrefix(tag, "+")
				if err := utils.ExecCommandInDir(tempDir, "task", taskID, "modify", "+"+tagValue, "rc.confirmation=off"); err != nil {
					return fmt.Errorf("failed to add tag %s: %v", tagValue, err)
				}
			} else if strings.HasPrefix(tag, "-") {
				tagValue := strings.TrimPrefix(tag, "-")
				if err := utils.ExecCommandInDir(tempDir, "task", taskID, "modify", "-"+tagValue, "rc.confirmation=off"); err != nil {
					return fmt.Errorf("failed to remove tag %s: %v", tagValue, err)
				}
			} else {
				if err := utils.ExecCommandInDir(tempDir, "task", taskID, "modify", "+"+tag, "rc.confirmation=off"); err != nil {
					return fmt.Errorf("failed to add tag %s: %v", tag, err)
				}
			}
		}
	}

	if start != "" {
		if err := utils.ExecCommandInDir(tempDir, "task", taskID, "modify", "start:"+start, "rc.confirmation=off"); err != nil {
			return fmt.Errorf("failed to set start date %s: %v", start, err)
		}
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}
	return nil
}
