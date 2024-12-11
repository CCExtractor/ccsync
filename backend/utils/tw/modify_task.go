package tw

import (
	"ccsync_backend/utils"
	"fmt"
	"os"
	"strings"
)

func ModifyTaskInTaskwarrior(uuid, description, project, priority, status, due, email, encryptionSecret, taskuuid string) error {
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

	escapedDescription := fmt.Sprintf(`description:"%s"`, strings.ReplaceAll(description, `"`, `\"`))

	if err := utils.ExecCommand("task", taskuuid, "modify", escapedDescription); err != nil {
		return fmt.Errorf("failed to edit task: %v", err)
	}

	escapedProject := fmt.Sprintf(`project:%s`, strings.ReplaceAll(project, `"`, `\"`))
	if err := utils.ExecCommand("task", taskuuid, "modify", escapedProject); err != nil {
		return fmt.Errorf("failed to edit task project: %v", err)
	}

	escapedPriority := fmt.Sprintf(`priority:%s`, strings.ReplaceAll(priority, `"`, `\"`))
	if err := utils.ExecCommand("task", taskuuid, "modify", escapedPriority); err != nil {
		return fmt.Errorf("failed to edit task priority: %v", err)
	}

	escapedDue := fmt.Sprintf(`due:%s`, strings.ReplaceAll(due, `"`, `\"`))
	if err := utils.ExecCommand("task", taskuuid, "modify", escapedDue); err != nil {
		return fmt.Errorf("failed to edit task due: %v", err)
	}

	// escapedStatus := fmt.Sprintf(`status:%s`, strings.ReplaceAll(status, `"`, `\"`))
	if status == "completed" {
		utils.ExecCommand("task", taskuuid, "done", "rc.confirmation=off")
	} else if status == "deleted" {
		utils.ExecCommand("task", taskuuid, "delete", "rc.confirmation=off")
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}
	return nil
}
