package tw

import (
	"ccsync_backend/utils"
	"fmt"
	"os"
	"strings"
)

func ModifyTaskInTaskwarrior(uuid, description, project, priority, status, due, email, encryptionSecret, taskID string, tags []string) error {
	if err := utils.ExecCommand("rm", "-rf", "/root/.task"); err != nil {
		fmt.Println("1")
		return fmt.Errorf("error deleting Taskwarrior data: %v", err)
	}
	tempDir, err := os.MkdirTemp("", "taskwarrior-"+email)
	if err != nil {
		fmt.Println("2")
		return fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	origin := os.Getenv("CONTAINER_ORIGIN")
	if err := SetTaskwarriorConfig(tempDir, encryptionSecret, origin, uuid); err != nil {
		fmt.Println("4")
		return err
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		fmt.Println("5")
		return err
	}

	escapedDescription := fmt.Sprintf(`description:"%s"`, strings.ReplaceAll(description, `"`, `\"`))

	if err := utils.ExecCommand("task", taskID, "modify", escapedDescription); err != nil {
		fmt.Println("6")
		return fmt.Errorf("failed to edit task: %v", err)
	}

	escapedProject := fmt.Sprintf(`project:%s`, strings.ReplaceAll(project, `"`, `\"`))
	if err := utils.ExecCommand("task", taskID, "modify", escapedProject); err != nil {
		fmt.Println("7")
		return fmt.Errorf("failed to edit task project: %v", err)
	}

	escapedPriority := fmt.Sprintf(`priority:%s`, strings.ReplaceAll(priority, `"`, `\"`))
	if err := utils.ExecCommand("task", taskID, "modify", escapedPriority); err != nil {
		fmt.Println("8")
		return fmt.Errorf("failed to edit task priority: %v", err)
	}

	escapedDue := fmt.Sprintf(`due:%s`, strings.ReplaceAll(due, `"`, `\"`))
	if err := utils.ExecCommand("task", taskID, "modify", escapedDue); err != nil {
		fmt.Println("8")
		return fmt.Errorf("failed to edit task due: %v", err)
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
		fmt.Println("11")
		return err
	}

	return nil
}
