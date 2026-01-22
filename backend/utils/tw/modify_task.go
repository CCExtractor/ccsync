package tw

import (
	"ccsync_backend/utils"
	"fmt"
	"os"
	"strings"
)

func ModifyTaskInTaskwarrior(uuid, description, project, priority, status, due, email, encryptionSecret, taskID string, tags []string, depends []string) error {
	if err := utils.ExecCommand("rm", "-rf", "/root/.task"); err != nil {
		return fmt.Errorf("error deleting Taskwarrior data: %v", err)
	}
	tempDir, err := os.MkdirTemp("", utils.SafeTempDirPrefix("taskwarrior-", email))
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

	escapedDescription := fmt.Sprintf(`description:"%s"`, strings.ReplaceAll(description, `"`, `\"`))

	if err := utils.ExecCommand("task", taskID, "modify", escapedDescription); err != nil {
		return fmt.Errorf("failed to edit task: %v", err)
	}

	escapedProject := fmt.Sprintf(`project:%s`, strings.ReplaceAll(project, `"`, `\"`))
	if err := utils.ExecCommand("task", taskID, "modify", escapedProject); err != nil {
		return fmt.Errorf("failed to edit task project: %v", err)
	}

	escapedPriority := fmt.Sprintf(`priority:%s`, strings.ReplaceAll(priority, `"`, `\"`))
	if err := utils.ExecCommand("task", taskID, "modify", escapedPriority); err != nil {
		return fmt.Errorf("failed to edit task priority: %v", err)
	}

	escapedDue := fmt.Sprintf(`due:%s`, strings.ReplaceAll(due, `"`, `\"`))
	if err := utils.ExecCommand("task", taskID, "modify", escapedDue); err != nil {
		return fmt.Errorf("failed to edit task due: %v", err)
	}

	// Handle dependencies - always set to ensure clearing works
	dependsStr := strings.Join(depends, ",")
	if err := utils.ExecCommand("task", taskID, "modify", "depends:"+dependsStr); err != nil {
		return fmt.Errorf("failed to set dependencies %s: %v", dependsStr, err)
	}

	// escapedStatus := fmt.Sprintf(`status:%s`, strings.ReplaceAll(status, `"`, `\"`))
	if status == "completed" {
		utils.ExecCommand("task", taskID, "done", "rc.confirmation=off")
	} else if status == "deleted" {
		utils.ExecCommand("task", taskID, "delete", "rc.confirmation=off")
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

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	return nil
}
